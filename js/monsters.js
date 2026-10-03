// Quái vật: 5 loại với hành vi khác nhau
(function () {
  const U = G.U;

  class Monster {
    constructor(type, x, y, diff) {
      const T = G.MONSTERS[type];
      this.type = type; this.T = T;
      this.x = x; this.y = y; this.r = T.r;
      this.hp = T.hp * (1 + diff * 0.12); this.maxHp = this.hp;
      this.dmg = T.dmg * (1 + diff * 0.04);
      this.speed = T.speed * (1 + Math.min(diff, 6) * 0.025);
      this.kx = 0; this.ky = 0;
      this.slide = 1; this.slideT = 0;
      this.atkT = U.rand(0.2, T.atkCd);
      this.wallT = 0; this.t = U.rand(0, 10);
      this.flash = 0; this.ang = 0; this.dead = false;
      this.shootT = U.rand(1, 2.4);
      this.strafe = Math.random() < 0.5 ? 1 : -1;
    }

    hurt(d, ang) {
      this.hp -= d; this.flash = 0.12;
      this.kx += Math.cos(ang) * this.T.kb; this.ky += Math.sin(ang) * this.T.kb;
      G.FX.text(this.x, this.y - this.r - 8, String(Math.round(d)), '#fff3c4');
      G.FX.burst(this.x, this.y, this.T.color, 4, 120, 0.35);
      G.Sfx.hit();
      if (this.hp <= 0 && !this.dead) {
        this.dead = true;
        G.FX.burst(this.x, this.y, this.T.color, 14, 190, 0.7);
        G.Sfx.kill();
      }
    }

    update(dt, P) {
      const T = this.T;
      this.t += dt; this.flash -= dt;
      const dx = P.x - this.x, dy = P.y - this.y, d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      this.ang = Math.atan2(dy, dx);
      let mx = ux, my = uy;

      if (T.ranged) {
        if (d < 190) { mx = -ux * 0.8; my = -uy * 0.8; }
        else if (d < 270) { mx = -uy * 0.7 * this.strafe; my = ux * 0.7 * this.strafe; }
        this.shootT -= dt;
        if (this.shootT <= 0 && d < 430) {
          this.shootT = T.shootCd;
          const s = 210;
          G.proj.push({ x: this.x, y: this.y, vx: ux * s, vy: uy * s, life: 3, dmg: this.dmg, r: 6 });
        }
      }
      if (T.flying) {
        const w = Math.sin(this.t * 6) * 0.9;
        mx = ux - uy * w; my = uy + ux * w;
      }
      if (this.slideT > 0) { this.slideT -= dt; mx += -uy * this.slide * 1.2; my += ux * this.slide * 1.2; }
      const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;

      const decay = Math.exp(-dt * 9);
      this.kx *= decay; this.ky *= decay;
      const res = G.World.move(this, (mx * this.speed + this.kx) * dt, (my * this.speed + this.ky) * dt, T.flying);

      if (res.blocked && !res.wall && this.slideT <= 0) { this.slide = Math.random() < 0.5 ? 1 : -1; this.slideT = 0.7; }

      // cản đường bởi tường -> đập tường
      if (res.wall) {
        const w = res.wall;
        const toward = (w.x + 20 - this.x) * ux + (w.y + 20 - this.y) * uy > 0;
        if (toward) {
          this.wallT -= dt;
          if (this.wallT <= 0) {
            this.wallT = 0.7;
            w.hp -= this.dmg * T.wallMul; w.flash = 0.15;
            G.FX.burst(w.x + 20, w.y + 20, w.type === 'wood' ? '#8a5f3a' : '#9aa1a6', 5, 100, 0.35);
            if (w.hp <= 0) { G.World.removeWall(w); G.FX.burst(w.x + 20, w.y + 20, '#777', 14, 160, 0.6); }
          }
        }
      }

      // tấn công người chơi
      if (!T.ranged && d < this.r + P.r + 6) {
        this.atkT -= dt;
        if (this.atkT <= 0) {
          this.atkT = T.atkCd;
          P.hurt(this.dmg);
          this.kx -= ux * 90; this.ky -= uy * 90;
        }
      } else this.atkT = Math.min(this.atkT, T.atkCd);
    }
  }
  G.Monster = Monster;
})();
