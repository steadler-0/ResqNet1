let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Urgent triple-beep for incoming emergency */
export function playEmergencyAlert() {
  const ctx = getCtx();
  if (!ctx) return;

  const playBeep = (start, freq = 880) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  };

  const t0 = ctx.currentTime;
  playBeep(t0, 920);
  playBeep(t0 + 0.28, 780);
  playBeep(t0 + 0.56, 920);
}

/** Vibrate on mobile when emergency arrives */
export function vibrateEmergencyAlert() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([300, 120, 300, 120, 400]);
    } catch {
      /* unsupported */
    }
  }
}
