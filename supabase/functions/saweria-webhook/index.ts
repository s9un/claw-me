// Supabase Edge Function: saweria-webhook
// Docs: https://saweria.co/docs/webhook
// Deploy: supabase functions deploy saweria-webhook --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SAWERIA_STREAM_KEY = Deno.env.get('SAWERIA_STREAM_KEY') ?? '';
const TOKEN_PRICE_IDR = Number(Deno.env.get('TOKEN_PRICE_IDR') ?? '1000');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function verifySaweriaSignature(
  payloadText: string,
  signatureHeader: string | null,
  streamKey: string
): Promise<boolean> {
  if (!streamKey || !signatureHeader) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(streamKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadText));
  const expectedHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex.toLowerCase() === signatureHeader.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('saweria-callback-signature');

  if (SAWERIA_STREAM_KEY) {
    const valid = await verifySaweriaSignature(rawBody, signature, SAWERIA_STREAM_KEY);
    if (!valid) {
      console.error('Invalid Saweria signature. Header present:', Boolean(signature));
      return new Response(JSON.stringify({ error: 'Invalid Saweria signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  let payload: {
    id?: string;
    amount_raw?: number;
    donator_name?: string;
    donator_email?: string;
    message?: string;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
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
  const match = message.match(/CLAW:([a-zA-Z0-9_]{3,20})/i);
  const targetUsername = match?.[1] ?? payload.donator_name?.trim();
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

  await supabase.from('saweria_transactions').insert({
    id: txId,
    user_id: profile?.id ?? null,
    username_or_email: targetUsername || targetEmail || null,
    amount_idr: amountIdr,
    tokens_added: tokensToAdd,
    raw_payload: payload,
  });

  return new Response(
    JSON.stringify({ ok: true, tokens_added: tokensToAdd, matched_user: Boolean(profile) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
