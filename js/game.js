// Vòng lặp logic: spawn quái ngẫu nhiên từ mọi hướng, đợt tấn công, đặt công trình
(function () {
  const C = G.CFG, U = G.U, I = G.Input;

  // [loại, trọng số, độ khó tối thiểu (phút)]
  const POOL = [
    ['zombie', 10, 0], ['crawler', 6, 0.6], ['bat', 4, 0.4], ['runner', 5, 0.8], ['slime', 4, 1],
    ['archer', 4, 1.4], ['spitter', 4, 1.8], ['charger', 3, 2], ['bomber', 4, 2.2],
    ['ghost', 3, 2.5], ['shaman', 2, 3], ['brute', 3, 3],
  ];
  // mỗi đợt tấn công chọn 1 chủ đề để khác nhau
  const THEMES = [
    { name: 'hỗn hợp', types: null },
    { name: 'bầy nhện và dơi', types: ['crawler', 'bat', 'runner'] },
    { name: 'xác chết và ma', types: ['zombie', 'ghost', 'shaman', 'archer', 'spitter'] },
    { name: 'công thành', types: ['bomber', 'charger', 'brute', 'slime', 'zombie'] },
  ];

  const Game = G.Game = {
    time: 0, kills: 0, spawnT: 2, waveT: 40, wave: 0, regrowT: 3, best: 0, bossN: 0, bossKills: 0,

    start() {
      G.World.init();
      G.player = new G.Player();
      G.monsters.length = 0; G.proj.length = 0; G.spawnQ.length = 0; G.boss = null;
      G.FX.reset();
      this.time = 0; this.kills = 0; this.spawnT = 2; this.waveT = 40; this.wave = 0; this.regrowT = 3;
      this.bossN = 0; this.bossKills = 0;
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
    pickType(types) {
      const d = this.diff();
      let pool = [];
      for (const e of POOL) {
        if (d < e[2] || (types && types.indexOf(e[0]) < 0)) continue;
        pool.push([e[0], e[0] === 'zombie' ? Math.max(4, e[1] - d) : e[1]]);
      }
      if (!pool.length) pool = [['zombie', 1]];
      let tot = 0; for (const p of pool) tot += p[1];
      let r = Math.random() * tot;
      for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; }
      return 'zombie';
    },
    spawnGroup(type, ang) {   // nhện đi theo bầy
      const n = G.MONSTERS[type].pack || 1;
      for (let i = 0; i < n; i++) this.spawnAt(type, ang + (n > 1 ? U.rand(-0.18, 0.18) : 0));
    },
    flushSpawns() {
      const q = G.spawnQ;
      for (const s of q) {
        if (G.monsters.length >= C.MAX_MONSTERS + 40) break;
        G.monsters.push(new G.Monster(s.type, U.clamp(s.x, 30, C.WORLD - 30), U.clamp(s.y, 30, C.WORLD - 30), this.diff(), s.lvl));
      }
      q.length = 0;
    },
    spawnBoss(ang) {
      const P = G.player, n = this.bossN++;
      const type = G.BOSS_ORDER[n % G.BOSS_ORDER.length], lvl = 1 + Math.floor(n / G.BOSS_ORDER.length);
      const R = U.clamp(Math.max(innerWidth, innerHeight) * 0.5 + 120, 500, 860);
      let x = P.x, y = P.y;
      for (let k = 0; k < 12; k++) {
        const a = ang + (k ? U.rand(-1.2, 1.2) : 0);
        x = P.x + Math.cos(a) * R; y = P.y + Math.sin(a) * R;
        if (x > 60 && y > 60 && x < C.WORLD - 60 && y < C.WORLD - 60) break;
      }
      x = U.clamp(x, 60, C.WORLD - 60); y = U.clamp(y, 60, C.WORLD - 60);
      G.monsters.push(new G.Monster(type, x, y, this.diff(), lvl));
      return G.MONSTERS[type].name;
    },
    updateSpawner(dt) {
      const d = this.diff();
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = Math.max(0.5, 2.6 - d * 0.3) * U.rand(0.7, 1.3);
        const n = 1 + Math.floor(U.rand(0, 1 + d * 0.9)) + (d > 1 ? 1 : 0);
        for (let i = 0; i < n; i++) this.spawnGroup(this.pickType(), Math.random() * Math.PI * 2);
      }
      this.waveT -= dt;
      if (this.waveT <= 0) {
        this.waveT = 45; this.wave++;
        const th = U.pick(THEMES), ang = Math.random() * Math.PI * 2;
        let budget = 8 + Math.floor(d * 3 + this.wave * 1.5);
        while (budget > 0) {
          const t = this.pickType(th.types);
          this.spawnGroup(t, ang);
          budget -= G.MONSTERS[t].pack || 1;
        }
        G.Sfx.wave();
        let msg = 'Đợt ' + this.wave + ': ' + th.name + ' từ hướng ' + U.dirName(ang);
        if (this.wave % 3 === 0) {
          msg = 'TRÙM XUẤT HIỆN: ' + this.spawnBoss(ang + U.rand(-0.5, 0.5)) + ' - hướng ' + U.dirName(ang);
          G.Sfx.boss();
        }
        G.UI.banner(msg);
      }
    },

    // nổ: phá tường trong bán kính
    blast(x, y, R, dmg) {
      const W = G.World;
      for (const w of W.walls.slice()) {
        if (!W.circleHitsRect(x, y, R, w.x, w.y, C.CELL, C.CELL)) continue;
        w.hp -= dmg; w.flash = 0.15;
        if (w.hp <= 0) { W.removeWall(w); G.FX.burst(w.x + 20, w.y + 20, '#777', 12, 150, 0.5); }
      }
    },
    onBossDead(m) {
      const P = G.player, inv = P.inv;
      this.bossKills++;
      P.heal(40);
      inv.wood = Math.min(999, inv.wood + 25); inv.stone = Math.min(999, inv.stone + 25);
      G.FX.burst(m.x, m.y, '#ffd24a', 40, 340, 0.9); G.FX.ring(m.x, m.y, 200, '#ffd24a');
      G.FX.text(m.x, m.y - m.r - 20, '+25 gỗ  +25 đá', '#ffd24a');
      G.shake = Math.min(18, G.shake + 10);
      G.UI.banner('Hạ gục ' + m.T.name + '! Hồi 40 máu');
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
        if (kill) { G.FX.burst(p.x, p.y, p.color || '#b6c93c', 5, 80, 0.3); G.proj.splice(i, 1); }
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
      this.flushSpawns();
      this.separate();
      this.updateProjectiles(dt);
      this.updateSpawner(dt);

      // dọn quái chết
      for (let i = G.monsters.length - 1; i >= 0; i--) {
        const m = G.monsters[i];
        if (m.dead) { G.monsters.splice(i, 1); this.kills++; if (m.T.boss) this.onBossDead(m); }
      }
      G.boss = null;
      for (const m of G.monsters) if (m.T.boss) { G.boss = m; break; }

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
