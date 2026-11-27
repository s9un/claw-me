// Supabase Edge Function: saweria-webhook
// Docs: https://saweria.co/docs/webhook
// Deploy: npx supabase functions deploy saweria-webhook --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SAWERIA_STREAM_KEY = (Deno.env.get('SAWERIA_STREAM_KEY') ?? '').trim();
const TOKEN_PRICE_IDR = Number(Deno.env.get('TOKEN_PRICE_IDR') ?? '1000');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function computeHmacHex(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('saweria-callback-signature')?.trim().toLowerCase() ?? null;

  let payload: {
    version?: string;
    id?: string;
    amount_raw?: number;
    donator_name?: string;
    donator_email?: string;
    message?: string;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('Invalid JSON body:', rawBody.slice(0, 200));
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  console.log('Saweria webhook received:', {
    hasSignature: Boolean(signature),
    id: payload.id,
    amount_raw: payload.amount_raw,
    donator_name: payload.donator_name,
  });

  if (SAWERIA_STREAM_KEY) {
    if (!signature) {
      console.error('Missing saweria-callback-signature header');
      return new Response(JSON.stringify({ error: 'Missing Saweria signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expectedRaw = await computeHmacHex(rawBody, SAWERIA_STREAM_KEY);
    const concatData = `${payload.version ?? ''}${payload.id ?? ''}${payload.amount_raw ?? ''}${payload.donator_name ?? ''}${payload.donator_email ?? ''}`;
    const expectedConcat = await computeHmacHex(concatData, SAWERIA_STREAM_KEY);

    if (signature !== expectedRaw && signature !== expectedConcat) {
      console.error('Invalid Saweria signature', {
        receivedPrefix: signature.slice(0, 10),
        expectedRawPrefix: expectedRaw.slice(0, 10),
        expectedConcatPrefix: expectedConcat.slice(0, 10),
      });
      return new Response(JSON.stringify({ error: 'Invalid Saweria signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const txId = payload.id;
  const amountIdr = Number(payload.amount_raw ?? 0);
  const tokensToAdd = Math.floor(amountIdr / TOKEN_PRICE_IDR);

  if (!txId || tokensToAdd <= 0) {
    return new Response(JSON.stringify({ ok: true, skipped: 'Amount below 1 token' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Idempotency check
  const { data: existing } = await supabase
    .from('saweria_transactions')
    .select('id')
    .eq('id', txId)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract username from message format "CLAW:username" or match donator_email / donator_name
  const message = payload.message ?? '';
  const match = message.match(/CLAW:\s*([a-z0-9]{3,20})/i);
  const targetUsername = match?.[1]?.toLowerCase() ?? payload.donator_name?.trim().toLowerCase();
  const targetEmail = payload.donator_email?.trim();

  let profile: { id: string; paid_tokens: number } | null = null;

  if (targetUsername) {
    const { data } = await supabase
      .from('profiles')
      .select('id, paid_tokens')
      .ilike('username', targetUsername)
      .maybeSingle();
    profile = data;
  }

  if (!profile && targetEmail) {
    const { data } = await supabase
      .from('profiles')
      .select('id, paid_tokens')
      .ilike('email', targetEmail)
      .maybeSingle();
    profile = data;
  }

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        paid_tokens: profile.paid_tokens + tokensToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
  }

  const { error: insertErr } = await supabase.from('saweria_transactions').insert({
    id: txId,
    user_id: profile?.id ?? null,
    username_or_email: targetUsername || targetEmail || null,
    amount_idr: amountIdr,
    tokens_added: tokensToAdd,
    raw_payload: payload,
  });

  if (insertErr) {
    console.error('Failed to insert saweria_transactions:', insertErr);
  }

  return new Response(
    JSON.stringify({ ok: true, tokens_added: tokensToAdd, matched_user: Boolean(profile) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
