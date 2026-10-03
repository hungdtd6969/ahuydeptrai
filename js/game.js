// Vòng lặp logic: spawn quái ngẫu nhiên từ mọi hướng, đợt tấn công, đặt công trình
(function () {
  const C = G.CFG, U = G.U, I = G.Input;

  const Game = G.Game = {
    time: 0, kills: 0, spawnT: 2, waveT: 40, wave: 0, regrowT: 3, best: 0,

    start() {
      G.World.init();
      G.player = new G.Player();
      G.monsters.length = 0; G.proj.length = 0;
      G.FX.reset();
      this.time = 0; this.kills = 0; this.spawnT = 2; this.waveT = 40; this.wave = 0; this.regrowT = 3;
      G.build.mode = null; G.build.ghost = null;
      G.shake = 0;
      G.state = 'play';
      G.Sfx.unlock();
      G.UI.onStart();
    },

    diff() { return this.time / 60; },

    handleKeys() {
      const p = I.pressed;
      for (let i = 0; i < G.WEAPONS.length; i++) if (p['Digit' + (i + 1)]) G.Craft.equip(i);
      if (p.KeyC) G.UI.toggleCraft();
      if (p.KeyZ) G.Craft.startBuild('wood');
      if (p.KeyX) G.Craft.startBuild('stone');
      if (p.KeyF) G.Craft.startBuild('fire');
      if (p.Escape) { G.build.mode = null; G.UI.toggleCraft(false); }
      if (I.mouse.rightClick) G.build.mode = null;
    },

    updateBuild(dt) {
      const B = G.build, P = G.player, W = G.World;
      B.ghost = null; B.cool = Math.max(0, B.cool - dt);
      if (!B.mode) return;
      const def = G.BUILD[B.mode];
      let wx, wy;
      if (I.touch) {
        if (I.tap) I.aim = { x: I.tap.x, y: I.tap.y };
        if (I.aim) { wx = I.aim.x + G.cam.x; wy = I.aim.y + G.cam.y; }
        else { wx = P.x + Math.cos(P.angle) * 80; wy = P.y + Math.sin(P.angle) * 80; }
        const d = U.dist(wx, wy, P.x, P.y);
        if (d > C.REACH) { wx = P.x + (wx - P.x) / d * C.REACH; wy = P.y + (wy - P.y) / d * C.REACH; }
      } else { wx = I.mouse.x + G.cam.x; wy = I.mouse.y + G.cam.y; }

      let g;
      if (B.mode === 'fire') g = { x: wx, y: wy, valid: W.canPlaceFire(wx, wy) };
      else {
        const cx = Math.floor(wx / C.CELL), cy = Math.floor(wy / C.CELL);
        g = { cx, cy, x: cx * C.CELL + C.CELL / 2, y: cy * C.CELL + C.CELL / 2, valid: W.canPlaceWall(cx, cy, P, G.monsters) };
      }
      g.reach = U.dist(P.x, P.y, g.x, g.y) <= C.REACH + C.CELL * 0.5;
      g.afford = G.Craft.canAfford(def.cost);
      g.ok = g.valid && g.reach && g.afford;
      B.ghost = g;

      const edge = I.mouse.clicked || !!I.tap;
      const drag = I.mouse.down && !I.touch && B.mode !== 'fire' && B.cool <= 0;
      if (edge || drag) {
        if (g.ok) { G.Craft.place(B.mode, g); B.cool = 0.07; }
        else if (edge) {
          G.UI.toast(!g.afford ? 'Không đủ vật liệu' : !g.reach ? 'Xa quá, lại gần hơn' : 'Không đặt được ở đây');
        }
      }
    },

    // ---- Spawn quái ----
    spawnAt(type, ang) {
      const P = G.player;
      if (G.monsters.length >= C.MAX_MONSTERS) return;
      const R = U.clamp(Math.max(innerWidth, innerHeight) * 0.5 + 90, 460, 820);
      for (let k = 0; k < 8; k++) {
        const a = ang + (k === 0 ? 0 : U.rand(-0.6, 0.6)), rr = R + U.rand(0, 60);
        const x = P.x + Math.cos(a) * rr, y = P.y + Math.sin(a) * rr;
        if (x < 30 || y < 30 || x > C.WORLD - 30 || y > C.WORLD - 30) continue;
        G.monsters.push(new G.Monster(type, x, y, this.diff()));
        return;
      }
    },
    pickType() {
      const d = this.diff();
      const pool = [['zombie', 10]];
      if (d >= 0.4) pool.push(['bat', 4]);
      if (d >= 0.9) pool.push(['runner', 5]);
      if (d >= 1.8) pool.push(['spitter', 4]);
      if (d >= 3) pool.push(['brute', 3]);
      let tot = 0; for (const p of pool) tot += p[1];
      let r = Math.random() * tot;
      for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; }
      return 'zombie';
    },
    updateSpawner(dt) {
      const d = this.diff();
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = Math.max(0.8, 3.4 - d * 0.4) * U.rand(0.7, 1.3);
        const n = 1 + Math.floor(U.rand(0, 1 + d * 0.6));
        for (let i = 0; i < n; i++) this.spawnAt(this.pickType(), Math.random() * Math.PI * 2);
      }
      this.waveT -= dt;
      if (this.waveT <= 0) {
        this.waveT = 50; this.wave++;
        const ang = Math.random() * Math.PI * 2, n = 5 + Math.floor(d * 2.5 + this.wave);
        for (let i = 0; i < n; i++) this.spawnAt(this.pickType(), ang);
        G.Sfx.wave();
        G.UI.banner('Đợt ' + this.wave + ': quái tràn đến từ hướng ' + U.dirName(ang));
      }
    },

    updateProjectiles(dt) {
      const P = G.player, W = G.World;
      for (let i = G.proj.length - 1; i >= 0; i--) {
        const p = G.proj[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        let kill = p.life <= 0 || p.x < 0 || p.y < 0 || p.x > C.WORLD || p.y > C.WORLD;
        if (!kill) {
          const w = W.getWall(Math.floor(p.x / C.CELL), Math.floor(p.y / C.CELL));
          if (w) {
            w.hp -= p.dmg * 0.5; w.flash = 0.1; kill = true;
            if (w.hp <= 0) W.removeWall(w);
          }
        }
        if (!kill) {
          for (const t of W.trees) if (U.dist(p.x, p.y, t.x, t.y) < t.cr) { kill = true; break; }
        }
        if (!kill && U.dist(p.x, p.y, P.x, P.y) < p.r + P.r) { P.hurt(p.dmg); kill = true; }
        if (kill) { G.FX.burst(p.x, p.y, '#b6c93c', 5, 80, 0.3); G.proj.splice(i, 1); }
      }
    },

    separate() {
      const ms = G.monsters;
      for (let i = 0; i < ms.length; i++) {
        const a = ms[i];
        for (let j = i + 1; j < ms.length; j++) {
          const b = ms[j];
          if (a.T.flying !== b.T.flying) continue;
          const dx = b.x - a.x, dy = b.y - a.y, m = (a.r + b.r) * 0.9;
          if (dx > m || dx < -m || dy > m || dy < -m) continue;
          const d = Math.hypot(dx, dy);
          if (d >= m || d === 0) continue;
          const push = (m - d) * 0.5, nx = dx / d, ny = dy / d;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        }
      }
    },

    update(dt) {
      const P = G.player, W = G.World;
      this.time += dt;
      this.handleKeys();
      this.updateBuild(dt);
      P.update(dt);

      for (const m of G.monsters) m.update(dt, P);
      this.separate();
      this.updateProjectiles(dt);
      this.updateSpawner(dt);

      // dọn quái chết
      for (let i = G.monsters.length - 1; i >= 0; i--) {
        if (G.monsters[i].dead) { G.monsters.splice(i, 1); this.kills++; }
      }

      // lửa trại hồi máu
      for (const f of W.fires) {
        f.t += dt;
        if (U.dist(f.x, f.y, P.x, P.y) < C.FIRE_RANGE) P.heal(C.FIRE_HEAL * dt);
      }
      // hiệu ứng rung
      for (const t of W.trees) if (t.shake > 0) t.shake -= dt;
      for (const t of W.rocks) if (t.shake > 0) t.shake -= dt;
      for (const w of W.walls) if (w.flash > 0) w.flash -= dt;

      // cây đá mọc lại
      this.regrowT -= dt;
      if (this.regrowT <= 0) {
        this.regrowT = 5;
        if (W.trees.length < C.TREES) W.spawnTree(P.x, P.y, 450);
        if (W.rocks.length < C.ROCKS) W.spawnRock(P.x, P.y, 450);
      }

      G.FX.update(dt);
      G.shake = Math.max(0, G.shake - dt * 24);

      if (P.hp <= 0) this.die();
    },

    die() {
      G.state = 'dead';
      G.build.mode = null;
      try {
        const prev = parseFloat(localStorage.getItem('rungdem_best') || '0');
        this.best = Math.max(prev, this.time);
        localStorage.setItem('rungdem_best', String(this.best));
      } catch (e) { this.best = Math.max(this.best, this.time); }
      G.UI.onDead();
    },
  };
})();
