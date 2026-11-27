import type { Tier } from '../data/collectibles';

class ArcadeSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playCoin() {
    this.tone(987.77, 0.09, 'square', 0.08, 0);
    this.tone(1318.51, 0.22, 'square', 0.08, 0.08);
  }

  playMoveTick() {
    this.tone(180, 0.035, 'triangle', 0.04, 0, 140);
  }

  playDrop() {
    this.tone(420, 0.35, 'sawtooth', 0.06, 0, 140);
  }

  playGrab() {
    this.tone(240, 0.08, 'square', 0.08, 0, 160);
    this.tone(340, 0.09, 'triangle', 0.08, 0.06, 460);
  }

  playEmpty() {
    this.tone(260, 0.14, 'triangle', 0.08, 0, 180);
    this.tone(180, 0.22, 'triangle', 0.08, 0.12, 120);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.tone(n, 0.18, 'triangle', 0.12, i * 0.08);
    });
  }

  playReveal(tier: Tier) {
    if (tier === 'SSR' || tier === 'SS') {
      const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      fanfare.forEach((n, i) => {
        this.tone(n, 0.25, 'triangle', 0.13, i * 0.07);
      });
    } else if (tier === 'A' || tier === 'B') {
      this.tone(587.33, 0.14, 'sine', 0.12, 0);
      this.tone(880, 0.26, 'triangle', 0.12, 0.09);
    } else {
      this.tone(330, 0.15, 'triangle', 0.08, 0, 260);
    }
  }
}

export const soundEngine = new ArcadeSoundEngine();
