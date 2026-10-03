// Âm thanh đơn giản bằng WebAudio (không cần file ngoài)
G.Sfx = (function () {
  let ac = null;
  function ctx() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, d, type, vol, slide) {
    const a = ctx();
    if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + d);
  }
  return {
    unlock() { ctx(); },
    swing() { tone(220, 0.08, 'triangle', 0.04, 0.6); },
    hit() { tone(150, 0.1, 'square', 0.05, 0.5); },
    chop() { tone(310, 0.07, 'square', 0.045, 0.4); },
    hurt() { tone(95, 0.25, 'sawtooth', 0.08, 0.5); },
    craft() { tone(520, 0.14, 'triangle', 0.06, 1.6); },
    place() { tone(180, 0.1, 'square', 0.045, 0.8); },
    kill() { tone(210, 0.15, 'triangle', 0.05, 0.4); },
    wave() { tone(70, 0.6, 'sawtooth', 0.08, 1.8); },
  };
})();
