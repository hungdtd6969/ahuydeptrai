// Quái vật: 13 loại thường + 5 boss, mỗi con có hành vi riêng
(function () {
  const U = G.U, C = G.CFG, TAU = Math.PI * 2;
  G.spawnQ = [];   // hàng đợi sinh quái (tách slime, boss triệu hồi) - xử lý cuối mỗi frame

  class Monster {
    constructor(type, x, y, diff, lvl) {
      const T = G.MONSTERS[type];
      lvl = lvl || 1;
      const bm = T.boss ? 1 + 0.35 * (lvl - 1) : 1;
      this.type = type; this.T = T;
      this.x = x; this.y = y; this.r = T.r;
      this.hp = T.hp * (1 + diff * 0.12) * bm; this.maxHp = this.hp;
      this.dmg = T.dmg * (1 + diff * 0.04) * (T.boss ? 1 + 0.1 * (lvl - 1) : 1);
      this.speed = T.speed * (1 + Math.min(diff, 6) * 0.025);
      this.kx = 0; this.ky = 0;
      this.slide = 1; this.slideT = 0;
      this.atkT = U.rand(0.2, T.atkCd);
      this.wallT = 0; this.t = U.rand(0, 10);
      this.flash = 0; this.ang = 0; this.dead = false;
      this.shootT = U.rand(1, 2.4);
      this.strafe = Math.random() < 0.5 ? 1 : -1;
      // trạng thái đặc biệt
      this.st = 'move'; this.stT = 0; this.cdT = U.rand(1.2, 3); this.cdir = 0;
      this.abT = U.rand(2, 4); this.sumT = T.minion ? U.rand(4, 7) : 0;
      this.stun = 0; this.hit = false; this.rage = false; this.n = 0;
      this.fuse = -1; this.healT = U.rand(1.5, 3.5); this.tele = null; this.alpha = 1;
    }

    shoot(a, s, dmg, r, color, life) {
      G.proj.push({ x: this.x, y: this.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life || 3, dmg, r, color });
    }
    summon(type, n, rad) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        G.spawnQ.push({ type, x: this.x + Math.cos(a) * (this.r + rad), y: this.y + Math.sin(a) * (this.r + rad) });
      }
    }

    hurt(d, ang) {
      if (this.dead) return;
      this.hp -= d; this.flash = 0.12;
      this.kx += Math.cos(ang) * this.T.kb; this.ky += Math.sin(ang) * this.T.kb;
      G.FX.text(this.x, this.y - this.r - 8, String(Math.round(d)), '#fff3c4');
      G.FX.burst(this.x, this.y, this.T.color, 4, 120, 0.35);
      G.Sfx.hit();
      if (this.hp <= 0) {
        this.dead = true;
        G.FX.burst(this.x, this.y, this.T.color, this.T.boss ? 40 : 14, this.T.boss ? 300 : 190, 0.7);
        G.Sfx.kill();
        if (this.T.split) {
          for (let i = 0; i < 3; i++) G.spawnQ.push({ type: this.T.split, x: this.x + U.rand(-14, 14), y: this.y + U.rand(-14, 14) });
        }
      }
    }

    explode(P) {
      const R = 85;
      this.dead = true;
      G.FX.burst(this.x, this.y, '#ffb040', 26, 280, 0.8);
      G.FX.burst(this.x, this.y, '#ff5a30', 16, 200, 0.6);
      G.FX.ring(this.x, this.y, R, '#ffa040');
      G.Sfx.boom(); G.shake = Math.min(14, G.shake + 7);
      if (U.dist(this.x, this.y, P.x, P.y) < R + P.r) P.hurt(this.dmg);
      G.Game.blast(this.x, this.y, R, this.dmg * 5);
    }

    // ---- Lao tới: báo hiệu (wind) -> lao (dash) ----
    dashAI(dt) {
      const D = this.T.dash;
      if (this.st === 'wind') {
        this.stT -= dt;
        if (this.stT > 0.25) this.cdir = this.ang;   // 0.25s cuối khóa hướng: kịp né
        this.ang = this.cdir;
        this.tele = { line: this.cdir, len: D.speed * D.dur, p: 1 - this.stT / D.wind };
        if (this.stT <= 0) { this.st = 'dash'; this.stT = D.dur; this.hit = false; G.Sfx.swing(); }
        return { vx: 0, vy: 0 };
      }
      this.stT -= dt;
      this.ang = this.cdir;
      if (this.stT <= 0) { this.endDash(false); return null; }
      return { vx: Math.cos(this.cdir) * D.speed, vy: Math.sin(this.cdir) * D.speed, dash: true };
    }
    endDash(stunned) {
      const D = this.T.dash;
      this.st = 'move'; this.n++;
      this.cdT = D.cd * (this.rage ? 0.6 : 1) * U.rand(0.8, 1.2);
      this.strafe = -this.strafe;
      if (stunned) {
        this.stun = this.T.boss ? 1.4 : 0.7;
        G.FX.burst(this.x, this.y, '#ffe060', 10, 160, 0.5);
        G.FX.text(this.x, this.y - this.r - 22, 'Choáng!', '#ffe060');
        if (this.T.boss) G.shake = Math.min(14, G.shake + 6);
      }
    }

    // ---- AI riêng của boss: trả về null (đuổi bình thường), {mx,my} hoặc {ov:{vx,vy}} ----
    bossAI(dt, P, ux, uy, d) {
      const T = this.T, rg = this.rage;
      if (T.minion && this.st === 'move') {
        this.sumT -= dt;
        if (this.sumT <= 0) {
          this.sumT = T.minion.every * (rg ? 0.7 : 1);
          this.summon(T.minion.type, T.minion.n + (rg ? 2 : 0), 26);
          G.FX.ring(this.x, this.y, 90, '#c070ff'); G.FX.burst(this.x, this.y, '#c070ff', 16, 180, 0.6);
        }
      }
      switch (this.type) {
        case 'boss_golem': {   // đập đất: vòng tròn đỏ báo trước, phá tường quanh mình
          const dur = rg ? 0.7 : 1.0, R = rg ? 190 : 160;
          if (this.st === 'move') {
            this.abT -= dt;
            if (this.abT <= 0 && d < R + 140) { this.st = 'slam'; this.stT = dur; }
            return null;
          }
          this.stT -= dt;
          this.tele = { circle: R, p: 1 - this.stT / dur };
          if (this.stT <= 0) {
            G.Sfx.boom(); G.shake = Math.min(18, G.shake + 10);
            G.FX.burst(this.x, this.y, '#b9a890', 36, 380, 0.7); G.FX.ring(this.x, this.y, R, '#ffb080');
            if (d < R + P.r) P.hurt(this.dmg * 0.9);
            G.Game.blast(this.x, this.y, R, 140);
            this.st = 'move'; this.abT = rg ? 2.8 : 4.2;
          }
          return { ov: { vx: 0, vy: 0 } };
        }
        case 'boss_queen': {   // bắn quạt tơ độc, giữ khoảng cách
          this.shootT -= dt;
          if (this.shootT <= 0 && d < 560) {
            this.shootT = rg ? 1.7 : 2.4;
            const n = rg ? 7 : 5;
            for (let i = 0; i < n; i++) this.shoot(this.ang + (i - (n - 1) / 2) * 0.22, 240, this.dmg * 0.55, 7, '#d070ff', 3);
          }
          if (d < 170) return { mx: -ux * 0.8, my: -uy * 0.8 };
          if (d < 280) return { mx: -uy * this.strafe * 0.9, my: ux * this.strafe * 0.9 };
          return null;
        }
        case 'boss_lich': {    // dịch chuyển + xoáy đạn tròn, xuyên tường
          if (this.st === 'blink') {
            this.stT -= dt; this.alpha = 0.25 + 0.2 * Math.sin(this.t * 40);
            if (this.stT <= 0) {
              const a = U.rand(0, TAU);
              G.FX.burst(this.x, this.y, '#a060ff', 14, 200, 0.5);
              this.x = U.clamp(P.x + Math.cos(a) * 300, 40, C.WORLD - 40);
              this.y = U.clamp(P.y + Math.sin(a) * 300, 40, C.WORLD - 40);
              G.FX.burst(this.x, this.y, '#a060ff', 14, 200, 0.5); G.FX.ring(this.x, this.y, 70, '#a060ff');
              this.st = 'move'; this.abT = rg ? 4 : 6.5; this.alpha = 1; this.shootT = 0.3;
            }
            return { ov: { vx: 0, vy: 0 } };
          }
          this.alpha = 1;
          this.abT -= dt;
          if (this.abT <= 0) { this.st = 'blink'; this.stT = 0.6; return { ov: { vx: 0, vy: 0 } }; }
          this.shootT -= dt;
          if (this.shootT <= 0) {
            this.shootT = rg ? 1.2 : 1.8;
            const n = rg ? 12 : 9, off = this.t * 1.7;
            for (let i = 0; i < n; i++) this.shoot(off + i / n * TAU, 175, this.dmg * 0.6, 6, '#b070ff', 3.5);
          }
          if (d < 230) return { mx: -ux * 0.8, my: -uy * 0.8 };
          if (d < 380) return { mx: -uy * this.strafe * 0.7, my: ux * this.strafe * 0.7 };
          return null;
        }
        case 'boss_bat': {     // bay vòng quanh, bắn quạt âm thanh, thỉnh thoảng lao xuống
          this.shootT -= dt;
          if (this.shootT <= 0 && d < 500) {
            this.shootT = rg ? 1.6 : 2.4;
            const n = rg ? 5 : 3;
            for (let i = 0; i < n; i++) this.shoot(this.ang + (i - (n - 1) / 2) * 0.25, 260, this.dmg * 0.6, 6, '#b090ff', 2.6);
          }
          const k = U.clamp((d - 250) / 150, -1, 1);
          return { mx: ux * k - uy * this.strafe * 0.9, my: uy * k + ux * this.strafe * 0.9 };
        }
        default: return null;   // boss_boar: chỉ đuổi + lao tới (xử lý ở dash)
      }
    }

    update(dt, P) {
      if (this.dead) return;
      const T = this.T;
      this.t += dt; this.flash -= dt;
      const dx = P.x - this.x, dy = P.y - this.y, d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      this.ang = Math.atan2(dy, dx);
      this.tele = null;
      let mx = ux, my = uy, ov = null;

      if (T.boss && !this.rage && this.hp < this.maxHp * 0.5) {
        this.rage = true; this.speed *= 1.2;
        G.UI.banner(T.name + ' nổi điên!'); G.Sfx.boss(); G.shake = Math.min(18, G.shake + 8);
        G.FX.burst(this.x, this.y, '#ff4a30', 30, 260, 0.8); G.FX.ring(this.x, this.y, 140, '#ff4a30');
      }

      if (this.stun > 0) { this.stun -= dt; ov = { vx: 0, vy: 0 }; }
      else {
        if (T.dash) {
          if (this.st === 'move') {
            this.cdT -= dt;
            if (this.cdT <= 0 && d < T.dash.range && d > T.dash.min) { this.st = 'wind'; this.stT = T.dash.wind; this.cdir = this.ang; }
          } else ov = this.dashAI(dt);
        }
        if (this.fuse >= 0) {   // quái nổ: đứng im, nhấp nháy rồi nổ
          this.fuse -= dt; ov = { vx: 0, vy: 0 };
          this.tele = { circle: 85, p: Math.min(1, 1 - this.fuse / 0.5) };
          if (this.fuse <= 0) { this.explode(P); return; }
        }
        if (T.ranged) {
          const near = T.near || 190, far = T.far || 270;
          if (d < near) { mx = -ux * 0.8; my = -uy * 0.8; }
          else if (d < far) { mx = -uy * 0.7 * this.strafe; my = ux * 0.7 * this.strafe; }
          this.shootT -= dt;
          if (this.shootT <= 0 && d < 430) {
            this.shootT = T.shootCd;
            this.shoot(this.ang, T.ps || 210, this.dmg, 6, T.pc || '#c8de45', 3);
          }
        }
        if (T.healer) {   // pháp sư: hồi máu cho quái xung quanh (trừ boss)
          this.healT -= dt;
          if (this.healT <= 0) {
            this.healT = 3.5;
            G.FX.ring(this.x, this.y, 190, '#6aff8a');
            for (const o of G.monsters) {
              if (o === this || o.dead || o.T.boss || o.hp >= o.maxHp || U.dist(o.x, o.y, this.x, this.y) > 190) continue;
              const h = o.maxHp * 0.22; o.hp = Math.min(o.maxHp, o.hp + h);
              G.FX.text(o.x, o.y - o.r - 10, '+' + Math.round(h), '#8affa0');
            }
          }
        }
        const zw = T.flying ? 0.9 : (T.zig || 0);   // bay / chạy ngoằn ngoèo
        if (zw && !T.boss) {
          const w = Math.sin(this.t * (T.flying ? 6 : 9)) * zw;
          mx = ux - uy * w; my = uy + ux * w;
        }
        if (T.boss && !ov) {
          const b = this.bossAI(dt, P, ux, uy, d);
          if (b) { if (b.ov) ov = b.ov; else { mx = b.mx; my = b.my; } }
        }
      }

      let vx, vy;
      if (ov) { vx = ov.vx; vy = ov.vy; }
      else {
        if (this.slideT > 0) { this.slideT -= dt; mx += -uy * this.slide * 1.2; my += ux * this.slide * 1.2; }
        const ml = Math.hypot(mx, my) || 1;
        vx = mx / ml * this.speed; vy = my / ml * this.speed;
      }

      const decay = Math.exp(-dt * 9);
      this.kx *= decay; this.ky *= decay;
      const res = G.World.move(this, (vx + this.kx) * dt, (vy + this.ky) * dt, T.flying || T.phase);

      if (res.blocked && !res.wall && !ov && this.slideT <= 0) { this.slide = Math.random() < 0.5 ? 1 : -1; this.slideT = 0.7; }

      // đang lao: gây sát thương, húc tường (phá hoặc choáng)
      const dashing = !!(ov && ov.dash);
      if (dashing) {
        if (!this.hit && d < this.r + P.r + 6) { this.hit = true; P.hurt(this.dmg * 1.2); }
        if (res.wall) {
          const w = res.wall;
          w.hp -= this.dmg * T.wallMul * 3; w.flash = 0.15;
          G.FX.burst(w.x + 20, w.y + 20, w.type === 'wood' ? '#8a5f3a' : '#9aa1a6', 8, 140, 0.4);
          if (w.hp <= 0) { G.World.removeWall(w); G.FX.burst(w.x + 20, w.y + 20, '#777', 14, 160, 0.6); }
          else this.endDash(true);
        } else if (res.blocked) this.endDash(true);   // đâm vào cây/đá
      }

      // quái nổ: chạm người hoặc tường là châm ngòi
      if (T.explode && this.fuse < 0 && (d < this.r + P.r + 30 || res.wall)) this.fuse = 0.5;

      // cản đường bởi tường -> đập tường
      if (res.wall && !dashing) {
        const w = res.wall;
        const toward = (w.x + 20 - this.x) * ux + (w.y + 20 - this.y) * uy > 0;
        if (toward && T.wallMul > 0) {
          this.wallT -= dt;
          if (this.wallT <= 0) {
            this.wallT = 0.7;
            w.hp -= this.dmg * T.wallMul; w.flash = 0.15;
            G.FX.burst(w.x + 20, w.y + 20, w.type === 'wood' ? '#8a5f3a' : '#9aa1a6', 5, 100, 0.35);
            if (w.hp <= 0) { G.World.removeWall(w); G.FX.burst(w.x + 20, w.y + 20, '#777', 14, 160, 0.6); }
          }
        }
      }

      // tấn công cận chiến
      if (!T.ranged && !T.explode && this.stun <= 0 && !dashing && d < this.r + P.r + 6) {
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
