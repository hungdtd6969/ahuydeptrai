// Hạt bụi / mảnh vỡ và chữ bay (sát thương, tài nguyên)
G.FX = {
  parts: [],
  texts: [],
  rings: [],
  reset() { this.parts.length = 0; this.texts.length = 0; this.rings.length = 0; },
  ring(x, y, r, color) {
    this.rings.push({ x, y, r, color, life: 0.45, max: 0.45 });
    if (this.rings.length > 24) this.rings.shift();
  },
  burst(x, y, color, n, speed, life) {
    speed = speed || 120; life = life || 0.5;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.6), max: life, color, size: 2 + Math.random() * 2.5 });
    }
    if (this.parts.length > 500) this.parts.splice(0, this.parts.length - 500);
  },
  text(x, y, str, color) {
    this.texts.push({ x: x + (Math.random() - 0.5) * 14, y, str, color: color || '#fff', life: 0.9 });
    if (this.texts.length > 60) this.texts.shift();
  },
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].life -= dt;
      if (this.rings[i].life <= 0) this.rings.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt; t.y -= 34 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  },
};
