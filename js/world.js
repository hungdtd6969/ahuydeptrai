// Map: cây, đá, tường, lửa trại và va chạm
(function () {
  const C = G.CFG, U = G.U, CELL = C.CELL;

  const W = G.World = {
    size: C.WORLD,
    trees: [], rocks: [], walls: [], fires: [],
    wallMap: new Map(),
    centers: [],

    init() {
      this.trees.length = 0; this.rocks.length = 0; this.walls.length = 0; this.fires.length = 0;
      this.wallMap.clear();
      this.centers = [];
      for (let i = 0; i < 9; i++) this.centers.push({ x: U.rand(250, this.size - 250), y: U.rand(250, this.size - 250) });
      const mid = this.size / 2;
      let tries = 0;
      while (this.trees.length < C.TREES && tries++ < 6000) this.spawnTree(mid, mid, 190);
      tries = 0;
      while (this.rocks.length < C.ROCKS && tries++ < 6000) this.spawnRock(mid, mid, 160);
    },

    // tìm chỗ trống cách điểm (px,py) ít nhất minD
    findSpot(px, py, minD, clustered) {
      for (let a = 0; a < 25; a++) {
        let x, y;
        if (clustered && Math.random() < 0.65) {
          const c = U.pick(this.centers);
          x = c.x + (Math.random() + Math.random() + Math.random() - 1.5) * 520;
          y = c.y + (Math.random() + Math.random() + Math.random() - 1.5) * 520;
        } else { x = U.rand(70, this.size - 70); y = U.rand(70, this.size - 70); }
        if (x < 70 || y < 70 || x > this.size - 70 || y > this.size - 70) continue;
        if (U.dist(x, y, px, py) < minD) continue;
        if (this.overlapsAny(x, y, 46)) continue;
        return { x, y };
      }
      return null;
    },
    overlapsAny(x, y, d) {
      for (const t of this.trees) if (Math.abs(t.x - x) < d && Math.abs(t.y - y) < d) return true;
      for (const t of this.rocks) if (Math.abs(t.x - x) < d && Math.abs(t.y - y) < d) return true;
      return false;
    },

    spawnTree(px, py, minD) {
      const s = this.findSpot(px, py, minD, true);
      if (!s) return false;
      this.trees.push({ x: s.x, y: s.y, cr: 13, hp: 6, max: 6, sz: U.rand(0.85, 1.25), tone: U.ri(0, 2), shake: 0 });
      return true;
    },
    spawnRock(px, py, minD) {
      const s = this.findSpot(px, py, minD, false);
      if (!s) return false;
      const sz = U.rand(0.85, 1.3), pts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + U.rand(-0.2, 0.2), r = 17 * sz * U.rand(0.8, 1.15);
        pts.push(Math.cos(a) * r, Math.sin(a) * r * 0.85);
      }
      this.rocks.push({ x: s.x, y: s.y, cr: 17 * sz * 0.95, hp: 8, max: 8, sz, pts, shake: 0 });
      return true;
    },
    removeNode(n) {
      let i = this.trees.indexOf(n);
      if (i >= 0) { this.trees.splice(i, 1); return; }
      i = this.rocks.indexOf(n);
      if (i >= 0) this.rocks.splice(i, 1);
    },

    // ---- Tường ----
    key(cx, cy) { return cx + ',' + cy; },
    getWall(cx, cy) { return this.wallMap.get(cx + ',' + cy); },
    addWall(cx, cy, type) {
      const hp = G.BUILD[type].hp;
      const w = { cx, cy, x: cx * CELL, y: cy * CELL, type, hp, max: hp, flash: 0 };
      this.walls.push(w);
      this.wallMap.set(this.key(cx, cy), w);
      return w;
    },
    removeWall(w) {
      const i = this.walls.indexOf(w);
      if (i >= 0) this.walls.splice(i, 1);
      this.wallMap.delete(this.key(w.cx, w.cy));
    },
    addFire(x, y) {
      const f = { x, y, t: Math.random() * 10 };
      this.fires.push(f);
      return f;
    },

    circleHitsRect(x, y, r, rx, ry, rw, rh) {
      const px = U.clamp(x, rx, rx + rw), py = U.clamp(y, ry, ry + rh);
      return (x - px) * (x - px) + (y - py) * (y - py) < r * r;
    },
    canPlaceWall(cx, cy, player, monsters) {
      if (cx < 0 || cy < 0 || (cx + 1) * CELL > this.size || (cy + 1) * CELL > this.size) return false;
      if (this.getWall(cx, cy)) return false;
      const x = cx * CELL, y = cy * CELL;
      for (const t of this.trees) if (this.circleHitsRect(t.x, t.y, t.cr, x, y, CELL, CELL)) return false;
      for (const t of this.rocks) if (this.circleHitsRect(t.x, t.y, t.cr, x, y, CELL, CELL)) return false;
      if (this.circleHitsRect(player.x, player.y, player.r + 2, x, y, CELL, CELL)) return false;
      for (const m of monsters) if (!m.T.flying && this.circleHitsRect(m.x, m.y, m.r, x, y, CELL, CELL)) return false;
      for (const f of this.fires) if (this.circleHitsRect(f.x, f.y, 14, x, y, CELL, CELL)) return false;
      return true;
    },
    canPlaceFire(x, y) {
      if (x < 40 || y < 40 || x > this.size - 40 || y > this.size - 40) return false;
      for (const t of this.trees) if (U.dist(x, y, t.x, t.y) < t.cr + 20) return false;
      for (const t of this.rocks) if (U.dist(x, y, t.x, t.y) < t.cr + 20) return false;
      for (const f of this.fires) if (U.dist(x, y, f.x, f.y) < 36) return false;
      for (const w of this.walls) if (this.circleHitsRect(x, y, 16, w.x, w.y, CELL, CELL)) return false;
      return true;
    },

    // ---- Va chạm ----
    // Di chuyển thực thể tròn {x,y,r}; trả về {wall, blocked}
    move(e, dx, dy, flying) {
      e.x += dx; e.y += dy;
      e.x = U.clamp(e.x, e.r, this.size - e.r);
      e.y = U.clamp(e.y, e.r, this.size - e.r);
      const res = { wall: null, blocked: false };
      if (flying) return res;
      for (const t of this.trees) this._circ(e, t, res);
      for (const t of this.rocks) this._circ(e, t, res);
      const x0 = Math.floor((e.x - e.r) / CELL), x1 = Math.floor((e.x + e.r) / CELL);
      const y0 = Math.floor((e.y - e.r) / CELL), y1 = Math.floor((e.y + e.r) / CELL);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const w = this.wallMap.get(cx + ',' + cy);
          if (w) this._rect(e, w, res);
        }
      }
      return res;
    },
    _circ(e, o, res) {
      const dx = e.x - o.x, dy = e.y - o.y, m = e.r + o.cr;
      if (dx > m || dx < -m || dy > m || dy < -m) return;
      const d2 = dx * dx + dy * dy;
      if (d2 >= m * m) return;
      const d = Math.sqrt(d2) || 0.001, push = m - d;
      e.x += dx / d * push; e.y += dy / d * push;
      res.blocked = true;
    },
    _rect(e, w, res) {
      const px = U.clamp(e.x, w.x, w.x + CELL), py = U.clamp(e.y, w.y, w.y + CELL);
      const dx = e.x - px, dy = e.y - py, d2 = dx * dx + dy * dy;
      if (d2 >= e.r * e.r) return;
      if (d2 === 0) {
        const l = e.x - w.x, r = w.x + CELL - e.x, t = e.y - w.y, b = w.y + CELL - e.y, mn = Math.min(l, r, t, b);
        if (mn === l) e.x = w.x - e.r; else if (mn === r) e.x = w.x + CELL + e.r;
        else if (mn === t) e.y = w.y - e.r; else e.y = w.y + CELL + e.r;
      } else {
        const d = Math.sqrt(d2), push = e.r - d;
        e.x += dx / d * push; e.y += dy / d * push;
      }
      res.wall = w; res.blocked = true;
    },
  };
})();
