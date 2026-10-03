// Người chơi: di chuyển, đánh, chặt cây/đục đá, máu tụt dần
(function () {
  const C = G.CFG, U = G.U, I = G.Input;

  class Player {
    constructor() {
      this.x = C.WORLD / 2; this.y = C.WORLD / 2; this.r = C.PLAYER_R;
      this.hp = C.MAX_HP;
      this.pending = 0;           // sát thương đã nhận nhưng chưa trừ hết (tụt dần)
      this.angle = 0;
      this.inv = { wood: 0, stone: 0 };
      this.owned = G.WEAPONS.map((w, i) => i === 0);
      this.level = G.WEAPONS.map(() => 0);
      this.eq = 0;
      this.cd = 0; this.swingT = 0; this.hurtT = 0; this.walk = 0; this.moving = false;
    }
    get weapon() { return G.WEAPONS[this.eq]; }
    dmg(i) {
      i = i === undefined ? this.eq : i;
      return Math.round(G.WEAPONS[i].base * (1 + G.LEVEL_BONUS * this.level[i]));
    }
    hurt(d) {
      this.pending += d;
      this.hurtT = 0.35;
      G.shake = Math.min(10, G.shake + 2 + d * 0.25);
      G.FX.text(this.x, this.y - 26, '-' + Math.round(d), '#ff6a55');
      G.Sfx.hurt();
    }
    heal(a) { this.hp = Math.min(C.MAX_HP, this.hp + a); }

    update(dt) {
      this.cd -= dt; this.swingT -= dt; this.hurtT -= dt;

      // máu tụt từ từ
      if (this.pending > 0) {
        const a = Math.min(this.pending, C.DRAIN * dt);
        this.pending -= a; this.hp -= a;
      }

      // di chuyển
      let ix = 0, iy = 0;
      const K = I.keys;
      if (K.KeyW || K.ArrowUp) iy -= 1;
      if (K.KeyS || K.ArrowDown) iy += 1;
      if (K.KeyA || K.ArrowLeft) ix -= 1;
      if (K.KeyD || K.ArrowRight) ix += 1;
      if (I.joy.active) { ix = I.joy.x; iy = I.joy.y; }
      const len = Math.hypot(ix, iy);
      if (len > 1) { ix /= len; iy /= len; }
      this.moving = len > 0.1;
      const sp = C.PLAYER_SPEED * (this.swingT > 0 ? 0.85 : 1);
      if (this.moving) { G.World.move(this, ix * sp * dt, iy * sp * dt); this.walk += dt * 10; }

      // hướng nhìn
      if (!I.touch && I.mouse.active) {
        this.angle = Math.atan2(I.mouse.y + G.cam.y - this.y, I.mouse.x + G.cam.x - this.x);
      } else if (len > 0.2) {
        this.angle = Math.atan2(iy, ix);
      }

      // đánh
      const atk = (!I.touch && I.mouse.down) || I.keys.Space || I.touchAtk;
      if (atk && !G.build.mode && this.cd <= 0) this.swing();
    }

    autoAim() {
      let best = null, bd = 170;
      for (const m of G.monsters) {
        const d = U.dist(m.x, m.y, this.x, this.y);
        if (d < bd) { bd = d; best = m; }
      }
      if (!best) {
        bd = 95;
        const W = G.World;
        for (const n of W.trees.concat(W.rocks)) {
          const d = U.dist(n.x, n.y, this.x, this.y);
          if (d < bd) { bd = d; best = n; }
        }
      }
      if (best) this.angle = Math.atan2(best.y - this.y, best.x - this.x);
    }

    swing() {
      if (I.touch) this.autoAim();
      const w = this.weapon, dmg = this.dmg();
      this.cd = w.cd; this.swingT = 0.2;
      G.Sfx.swing();

      // đánh quái (một nhát trúng mọi quái trong cung)
      for (const m of G.monsters) {
        const cd = U.dist(m.x, m.y, this.x, this.y);
        if (cd - m.r > w.range) continue;
        const a = Math.atan2(m.y - this.y, m.x - this.x);
        if (cd > m.r + 10 && Math.abs(U.angDiff(a, this.angle)) > w.arc / 2) continue;
        m.hurt(dmg, a);
      }

      // chặt cây / đục đá: lấy vật gần nhất trong cung
      const W = G.World;
      let best = null, bd = 1e9, isTree = false;
      const test = (n, tree) => {
        const cd = U.dist(n.x, n.y, this.x, this.y);
        if (cd - n.cr > w.range || cd >= bd) return;
        const a = Math.atan2(n.y - this.y, n.x - this.x);
        if (cd - n.cr > 8 && Math.abs(U.angDiff(a, this.angle)) > w.arc / 2) return;
        best = n; bd = cd; isTree = tree;
      };
      for (const t of W.trees) test(t, true);
      for (const t of W.rocks) test(t, false);
      if (best) this.harvest(best, isTree);
    }

    harvest(n, isTree) {
      const w = this.weapon;
      const amt = isTree ? w.gW : w.gS;
      n.hp -= 1; n.shake = 0.18;
      this.inv[isTree ? 'wood' : 'stone'] = Math.min(999, this.inv[isTree ? 'wood' : 'stone'] + amt);
      G.FX.text(n.x, n.y - 30, '+' + amt + (isTree ? ' gỗ' : ' đá'), isTree ? '#e0aa6c' : '#c3cbd2');
      G.FX.burst(n.x, n.y - 8, isTree ? '#8a5f3a' : '#9aa1a6', 5, 110, 0.4);
      G.Sfx.chop();
      if (n.hp <= 0) {
        const bonus = 2;
        this.inv[isTree ? 'wood' : 'stone'] = Math.min(999, this.inv[isTree ? 'wood' : 'stone'] + bonus);
        G.FX.text(n.x, n.y - 46, '+' + bonus + (isTree ? ' gỗ' : ' đá'), isTree ? '#e0aa6c' : '#c3cbd2');
        G.FX.burst(n.x, n.y - 10, isTree ? '#2f5a35' : '#7c8388', 16, 170, 0.7);
        G.World.removeNode(n);
      }
    }
  }
  G.Player = Player;
})();
