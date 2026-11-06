/**
 * Web Audio API synthesizer for audible bill alarms.
 * Uses native oscillators and gain envelopes without external asset dependencies.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playAlarmSound = (
  soundType: 'gentle_chime' | 'digital_alert' | 'urgent_beep' = 'digital_alert',
  volume: number = 0.7
): boolean => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    const clampedVol = Math.max(0.05, Math.min(1.0, volume));
    const now = ctx.currentTime;

    if (soundType === 'gentle_chime') {
      // Harmonic pleasant chime (C6 + E6 chord with slow decay)
      const notes = [1046.5, 1318.5, 1567.9];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(clampedVol * 0.35, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
      return true;
    }

    if (soundType === 'urgent_beep') {
      // Insistent dual pulse beep for overdue bills
      const beeps = [0, 0.22, 0.44];
      beeps.forEach((startOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now + startOffset); // A5

        gain.gain.setValueAtTime(0, now + startOffset);
        gain.gain.linearRampToValueAtTime(clampedVol * 0.5, now + startOffset + 0.02);
        gain.gain.setValueAtTime(clampedVol * 0.5, now + startOffset + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + 0.2);
      });
      return true;
    }

    // Default: 'digital_alert' - Three crisp modern notification notes
    const melody = [
      { freq: 587.33, start: 0, duration: 0.12 },     // D5
      { freq: 739.99, start: 0.14, duration: 0.12 },  // F#5
      { freq: 880.0, start: 0.28, duration: 0.4 },    // A5
    ];

    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(clampedVol * 0.45, now + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.05);
    });

    return true;
  } catch (err) {
    console.warn('Erro ao reproduzir alarme sonoro:', err);
    return false;
  }
};
