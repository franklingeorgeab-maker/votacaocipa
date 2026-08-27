/**
 * TSE Electronic Ballot Box (Urna Eletrônica) Sound Synthesizer
 * Reproduz fielmente os sinais sonoros da Urna Eletrônica Brasileira usando Web Audio API.
 */

class TSEAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Som de digitação de número ou tecla na urna (Beep curto de 1000 Hz)
   */
  public playDigitBeep(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  /**
   * Som de correção (CORRIGE)
   */
  public playCorrectionBeep(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(360, now + 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Som Oficial e Idêntico de Finalização de Voto da Urna Eletrônica do TSE
   * Sequência harmônica clássica com timbre e frequência fiéis (pili-pili-piiim / TRIMMM!)
   */
  public playTSEConfirmationSound(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Frequências clássicas da urna eletrônica do TSE
      // Fase 1: 3 beeps rápidos ascendentes (preparação)
      // Fase 2: Tom final longo e potente com harmônicos característicos (~1350Hz + 2700Hz com envelope rico)
      
      const beeps = [
        { freq: 880, start: 0.0, dur: 0.09 },
        { freq: 1100, start: 0.11, dur: 0.09 },
        { freq: 1320, start: 0.22, dur: 0.11 },
      ];

      beeps.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.4 * this.volume, now + start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.01);
      });

      // Tom Final Característico (O famoso "TRIIIIIIIIIM" da Urna)
      const finalStart = now + 0.36;
      const finalDuration = 1.35;

      // Oscilador Principal (Onda retangular/quadrada suavizada com filtro passa-baixa para o timbre exato do buzzer)
      const finalOsc1 = ctx.createOscillator();
      const finalOsc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const finalGain = ctx.createGain();

      finalOsc1.type = 'square';
      finalOsc1.frequency.setValueAtTime(1400, finalStart);

      finalOsc2.type = 'sawtooth';
      finalOsc2.frequency.setValueAtTime(1403, finalStart); // ligeiro detune para encorpar

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, finalStart);

      finalGain.gain.setValueAtTime(0, finalStart);
      finalGain.gain.linearRampToValueAtTime(0.45 * this.volume, finalStart + 0.02);
      // Sustentação constante característica da urna
      finalGain.gain.setValueAtTime(0.45 * this.volume, finalStart + finalDuration - 0.08);
      finalGain.gain.exponentialRampToValueAtTime(0.0001, finalStart + finalDuration);

      finalOsc1.connect(filter);
      finalOsc2.connect(filter);
      filter.connect(finalGain);
      finalGain.connect(ctx.destination);

      finalOsc1.start(finalStart);
      finalOsc2.start(finalStart);
      finalOsc1.stop(finalStart + finalDuration + 0.05);
      finalOsc2.stop(finalStart + finalDuration + 0.05);

    } catch (e) {
      console.warn('Erro ao reproduzir som da urna:', e);
    }
  }
}

export const tseAudio = new TSEAudioEngine();
