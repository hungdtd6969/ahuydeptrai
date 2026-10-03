// Vẽ game lên canvas: nền, cây, đá, tường, quái, bóng tối + ánh sáng
(function () {
  const C = G.CFG, U = G.U;
  const R = G.Render = { w: 0, h: 0, time: 0 };
  let cv, ctx, dark, dctx, pattern, dpr = 1;
  const list = [];
  const TREE_TONES = [['#1d3a25', '#27502f'], ['#183222', '#234a2b'], ['#21402a', '#2d5834']];

  R.init = function (canvas) {
    cv = canvas; ctx = cv.getContext('2d');
    dark = document.createElement('canvas'); dctx = dark.getContext('2d');
    makePattern();
    R.resize();
    addEventListener('resize', R.resize);
  };

  function makePattern() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#17241b'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1100; i++) {
      const x = Math.random() * 256, y = Math.random() * 256, s = Math.random();
      g.fillStyle = s < 0.5 ? 'rgba(10,20,13,.5)' : s < 0.85 ? 'rgba(48,74,50,.35)' : 'rgba(70,92,60,.3)';
      g.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    g.strokeStyle = 'rgba(58,92,58,.55)'; g.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 250 + 3, y = Math.random() * 250 + 6;
      g.beginPath();
      g.moveTo(x, y); g.lineTo(x - 2, y - 6);
      g.moveTo(x, y); g.lineTo(x + 1, y - 7);
      g.moveTo(x, y); g.lineTo(x + 3, y - 5);
      g.stroke();
    }
    pattern = ctx.createPattern(c, 'repeat');
  }

  R.resize = function () {
    R.w = innerWidth; R.h = innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(R.w * dpr); cv.height = Math.round(R.h * dpr);
    cv.style.width = R.w + 'px'; cv.style.height = R.h + 'px';
    dark.width = cv.width; dark.height = cv.height;
  };

  R.updateCam = function () {
    const P = G.player, S = C.WORLD;
    const px = P ? P.x : S / 2, py = P ? P.y : S / 2;
    G.cam.x = U.clamp(px - R.w / 2, -90, Math.max(-90, S - R.w + 90));
    G.cam.y = U.clamp(py - R.h / 2, -90, Math.max(-90, S - R.h + 90));
  };

  const ell = (x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const circ = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

  // ---------- Sprite ----------
  function drawTree(t) {
    const sz = t.sz, sx = t.shake > 0 ? Math.sin(t.shake * 90) * 3 : 0;
    const P = G.player;
    const tone = TREE_TONES[t.tone];
    ctx.save(); ctx.translate(t.x + sx, t.y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(0, 6, 30 * sz, 11 * sz);
    ctx.fillStyle = '#4a3524'; ctx.fillRect(-5 * sz, -26 * sz, 10 * sz, 32 * sz);
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(1 * sz, -26 * sz, 4 * sz, 32 * sz);
    const hidePlayer = P && Math.abs(P.x - t.x) < 36 * sz && P.y < t.y && t.y - P.y < 70 * sz;
    ctx.globalAlpha = hidePlayer ? 0.45 : 1;
    ctx.fillStyle = tone[0];
    circ(0, -40 * sz, 25 * sz); circ(-15 * sz, -28 * sz, 19 * sz); circ(15 * sz, -28 * sz, 19 * sz); circ(0, -54 * sz, 16 * sz);
    ctx.fillStyle = tone[1];
    circ(-5 * sz, -46 * sz, 15 * sz); circ(-16 * sz, -31 * sz, 10 * sz); circ(6 * sz, -58 * sz, 8 * sz);
    ctx.restore();
  }

  function drawRock(r) {
    const sx = r.shake > 0 ? Math.sin(r.shake * 90) * 2.5 : 0;
    ctx.save(); ctx.translate(r.x + sx, r.y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(2, 8, r.cr * 1.2, r.cr * 0.5);
    ctx.beginPath();
    for (let i = 0; i < r.pts.length; i += 2) i ? ctx.lineTo(r.pts[i], r.pts[i + 1] - 4) : ctx.moveTo(r.pts[0], r.pts[1] - 4);
    ctx.closePath();
    ctx.fillStyle = '#5b6064'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#3b3f43'; ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < r.pts.length; i += 2) {
      const x = r.pts[i] * 0.6 - 2, y = r.pts[i + 1] * 0.55 - 8;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = '#7a8085'; ctx.fill();
    ctx.restore();
  }

  function drawWall(w) {
    const x = w.x, y = w.y, s = C.CELL, wood = w.type === 'wood';
    ctx.fillStyle = wood ? '#6d4b2b' : '#7b8085'; ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = wood ? '#44301c' : '#4a4e52'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (wood) { for (let i = 1; i < 4; i++) { ctx.moveTo(x, y + i * 10); ctx.lineTo(x + s, y + i * 10); } }
    else {
      for (let i = 1; i < 4; i++) { ctx.moveTo(x, y + i * 10); ctx.lineTo(x + s, y + i * 10); }
      for (let i = 0; i < 4; i++) { const o = (i % 2) * 10 + 10; ctx.moveTo(x + o, y + i * 10); ctx.lineTo(x + o, y + i * 10 + 10); ctx.moveTo(x + o + 20, y + i * 10); ctx.lineTo(x + o + 20, y + i * 10 + 10); }
    }
    ctx.stroke();
    ctx.fillStyle = wood ? 'rgba(255,220,160,.12)' : 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, s, 4);
    ctx.strokeStyle = wood ? '#2e2012' : '#33363a'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
    if (w.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, s, s); }
    if (w.hp < w.max) {
      const f = Math.max(0, w.hp / w.max);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x + 4, y - 7, s - 8, 4);
      ctx.fillStyle = f > 0.5 ? '#9ccf6a' : f > 0.25 ? '#e6b84a' : '#d9503f'; ctx.fillRect(x + 4, y - 7, (s - 8) * f, 4);
    }
  }

  function drawFire(f) {
    const fl = 0.85 + Math.sin(f.t * 13) * 0.08 + Math.sin(f.t * 7.3) * 0.07;
    ctx.save(); ctx.translate(f.x, f.y);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(0, 6, 16, 6);
    ctx.strokeStyle = '#4b3220'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, 5); ctx.lineTo(10, -2); ctx.moveTo(12, 5); ctx.lineTo(-10, -2); ctx.stroke();
    ctx.fillStyle = '#e8651f'; ell(0, -8, 9 * fl, 14 * fl);
    ctx.fillStyle = '#f5a53a'; ell(0, -6, 6 * fl, 10 * fl);
    ctx.fillStyle = '#ffe08a'; ell(0, -3, 3 * fl, 5.5 * fl);
    ctx.restore();
  }

  function drawPlayer(P) {
    ctx.save(); ctx.translate(P.x, P.y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(0, 9, 14, 6);
    const bob = P.moving ? Math.sin(P.walk) * 1.5 : 0;
    ctx.rotate(P.angle);
    // vũ khí
    const w = P.weapon, sw = P.swingT > 0 ? (1 - P.swingT / 0.2) : -1;
    const wa = sw >= 0 ? -0.9 + sw * 1.8 : 0.5;
    ctx.save(); ctx.rotate(wa);
    ctx.lineCap = 'round';
    switch (w.id) {
      case 'club': ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 6; line(10, 0, 34, 0); ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 9; line(30, 0, 36, 0); break;
      case 'knife': ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 4; line(8, 0, 18, 0); ctx.strokeStyle = '#b9c0c6'; ctx.lineWidth = 5; line(18, 0, 40, 0); break;
      case 'axe': ctx.strokeStyle = '#6a4828'; ctx.lineWidth = 4; line(8, 0, 40, 0); ctx.fillStyle = '#aab2b8'; ctx.beginPath(); ctx.moveTo(32, -3); ctx.lineTo(44, -14); ctx.lineTo(46, 4); ctx.lineTo(34, 3); ctx.closePath(); ctx.fill(); break;
      case 'spear': ctx.strokeStyle = '#6a4828'; ctx.lineWidth = 3.5; line(6, 0, 78, 0); ctx.fillStyle = '#c3cacf'; ctx.beginPath(); ctx.moveTo(76, -5); ctx.lineTo(96, 0); ctx.lineTo(76, 5); ctx.closePath(); ctx.fill(); break;
      default: break;
    }
    ctx.restore();
    // thân
    ctx.fillStyle = P.hurtT > 0 ? '#ff9a8a' : '#d8c79d'; circ(0, bob * 0.3, P.r);
    ctx.strokeStyle = '#3c3322'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, bob * 0.3, P.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#5b4a2e'; ctx.beginPath(); ctx.arc(-3, bob * 0.3, P.r * 0.78, Math.PI * 0.55, Math.PI * 1.45); ctx.fill();
    ctx.fillStyle = '#1d1a14'; circ(7, -4 + bob * 0.3, 2); circ(7, 4 + bob * 0.3, 2);
    // nhát chém
    if (sw >= 0 && w.id !== 'spear') {
      ctx.strokeStyle = 'rgba(255,245,210,' + (0.55 * (1 - sw)) + ')'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, w.range * 0.9, -w.arc / 2, -w.arc / 2 + w.arc * Math.min(1, sw * 1.6)); ctx.stroke();
    }
    ctx.restore();
  }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  function drawMonster(m) {
    const T = m.T;
    ctx.save();
    const lift = T.flying ? -16 + Math.sin(m.t * 9) * 3 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(m.x, m.y + m.r * 0.7, m.r, m.r * 0.4);
    ctx.translate(m.x, m.y + lift); ctx.rotate(m.ang);
    const r = m.r;
    switch (m.type) {
      case 'zombie':
        ctx.fillStyle = '#4d7040'; circ(r * 0.9, -r * 0.75, r * 0.38); circ(r * 0.9, r * 0.75, r * 0.38);
        ctx.fillStyle = T.color; circ(0, 0, r);
        ctx.fillStyle = '#3a5530'; circ(-r * 0.3, r * 0.2, r * 0.4);
        break;
      case 'runner':
        ctx.fillStyle = T.color;
        ctx.beginPath(); ctx.moveTo(r * 1.5, 0); ctx.lineTo(-r, -r * 1.05); ctx.lineTo(-r * 0.4, 0); ctx.lineTo(-r, r * 1.05); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8c4a22'; ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.5); ctx.lineTo(-r * 1.9, 0); ctx.lineTo(-r * 0.9, r * 0.5); ctx.closePath(); ctx.fill();
        break;
      case 'brute':
        ctx.fillStyle = '#d8d0b8';
        ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.8); ctx.lineTo(r * 0.9, -r * 1.5); ctx.lineTo(r * 0.8, -r * 0.5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(r * 0.3, r * 0.8); ctx.lineTo(r * 0.9, r * 1.5); ctx.lineTo(r * 0.8, r * 0.5); ctx.fill();
        ctx.fillStyle = '#6a3f48'; circ(r * 0.85, -r * 0.9, r * 0.42); circ(r * 0.85, r * 0.9, r * 0.42);
        ctx.fillStyle = T.color; circ(0, 0, r);
        ctx.fillStyle = '#6f4049'; circ(-r * 0.2, 0, r * 0.62);
        break;
      case 'spitter':
        ctx.fillStyle = T.color; ell(0, 0, r * 1.1, r * 0.95);
        ctx.fillStyle = '#7c8c22'; circ(-r * 0.4, -r * 0.3, r * 0.3); circ(-r * 0.2, r * 0.45, r * 0.22);
        ctx.fillStyle = '#2b3308'; circ(r * 0.75, 0, r * 0.32);
        break;
      case 'bat': {
        const f = Math.sin(m.t * 22) * 0.6;
        ctx.fillStyle = '#5b4690';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r * 0.5, -r * (1.9 + f)); ctx.lineTo(-r * 1.5, -r * 0.8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r * 0.5, r * (1.9 + f)); ctx.lineTo(-r * 1.5, r * 0.8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = T.color; circ(0, 0, r * 0.85);
        break;
      }
      default: break;
    }
    if (m.flash > 0) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff'; circ(0, 0, r); }
    ctx.restore();
    if (m.hp < m.maxHp) {
      const f = Math.max(0, m.hp / m.maxHp), bw = Math.max(26, r * 2);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(m.x - bw / 2, m.y + lift - r - 12, bw, 4);
      ctx.fillStyle = '#d9503f'; ctx.fillRect(m.x - bw / 2, m.y + lift - r - 12, bw * f, 4);
    }
  }

  // ---------- Khung hình ----------
  R.draw = function () {
    R.time += 1 / 60;
    const w = R.w, h = R.h, cam = G.cam, S = C.WORLD, P = G.player, W = G.World;
    const sh = G.shake, ox = sh ? (Math.random() - 0.5) * sh : 0, oy = sh ? (Math.random() - 0.5) * sh : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050806'; ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(-cam.x + ox, -cam.y + oy);

    // nền
    ctx.fillStyle = pattern; ctx.fillRect(0, 0, S, S);
    ctx.lineWidth = 14; ctx.strokeStyle = '#2b0f0d'; ctx.strokeRect(-7, -7, S + 14, S + 14);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(180,60,45,.55)'; ctx.strokeRect(0, 0, S, S);

    // danh sách vật thể cần vẽ (cắt theo khung nhìn, sắp theo y)
    const m = 90, x0 = cam.x - m, y0 = cam.y - m, x1 = cam.x + w + m, y1 = cam.y + h + m;
    list.length = 0;
    const vis = (o) => o.x > x0 && o.x < x1 && o.y > y0 && o.y < y1 + 60;
    for (const o of W.trees) if (vis(o)) list.push([o.y, 0, o]);
    for (const o of W.rocks) if (vis(o)) list.push([o.y, 1, o]);
    for (const o of W.walls) if (o.x > x0 && o.x < x1 && o.y > y0 && o.y < y1) list.push([o.y + 40, 2, o]);
    for (const o of W.fires) if (vis(o)) list.push([o.y, 3, o]);
    for (const o of G.monsters) if (vis(o)) list.push([o.y, 4, o]);
    if (P) list.push([P.y, 5, P]);
    list.sort((a, b) => a[0] - b[0]);
    for (const it of list) {
      switch (it[1]) {
        case 0: drawTree(it[2]); break;
        case 1: drawRock(it[2]); break;
        case 2: drawWall(it[2]); break;
        case 3: drawFire(it[2]); break;
        case 4: drawMonster(it[2]); break;
        default: if (G.state !== 'menu') drawPlayer(it[2]); break;
      }
    }

    // đạn độc
    for (const p of G.proj) {
      ctx.fillStyle = '#c8de45'; circ(p.x, p.y, p.r);
      ctx.fillStyle = 'rgba(200,222,69,.35)'; circ(p.x, p.y, p.r * 1.8);
    }
    // hạt
    for (const p of G.FX.parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // bóng công trình sắp đặt
    const B = G.build;
    if (B.mode && B.ghost) {
      const g = B.ghost;
      ctx.globalAlpha = 0.6;
      if (B.mode === 'fire') drawFire({ x: g.x, y: g.y, t: R.time });
      else drawWall({ x: g.cx * C.CELL, y: g.cy * C.CELL, type: B.mode, hp: 1, max: 1, flash: 0 });
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2; ctx.strokeStyle = g.ok ? 'rgba(160,240,140,.9)' : 'rgba(255,90,70,.95)';
      if (B.mode === 'fire') { ctx.beginPath(); ctx.arc(g.x, g.y, 20, 0, Math.PI * 2); ctx.stroke(); }
      else ctx.strokeRect(g.cx * C.CELL, g.cy * C.CELL, C.CELL, C.CELL);
      if (P) { ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(P.x, P.y, C.REACH, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();

    // ---- bóng tối + ánh sáng ----
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, w, h);
    dctx.fillStyle = 'rgba(3,6,12,' + C.DARK + ')'; dctx.fillRect(0, 0, w, h);
    dctx.globalCompositeOperation = 'destination-out';
    const light = (x, y, rad, str) => {
      const g = dctx.createRadialGradient(x, y, rad * 0.12, x, y, rad);
      g.addColorStop(0, 'rgba(0,0,0,' + str + ')'); g.addColorStop(0.6, 'rgba(0,0,0,' + str * 0.55 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g; dctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    };
    if (P && G.state !== 'menu') light(P.x - cam.x + ox, P.y - cam.y + oy, C.LIGHT, 0.95);
    for (const f of W.fires) {
      const fl = 1 + Math.sin(f.t * 11) * 0.04 + Math.sin(f.t * 5.7) * 0.03;
      const sx = f.x - cam.x + ox, sy = f.y - cam.y + oy;
      if (sx > -260 && sx < w + 260 && sy > -260 && sy < h + 260) light(sx, sy, 200 * fl, 0.95);
    }
    ctx.drawImage(dark, 0, 0, w, h);

    // ánh lửa ấm
    ctx.globalCompositeOperation = 'lighter';
    for (const f of W.fires) {
      const sx = f.x - cam.x + ox, sy = f.y - cam.y + oy;
      if (sx < -260 || sx > w + 260 || sy < -260 || sy > h + 260) continue;
      const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, 170);
      g.addColorStop(0, 'rgba(255,150,60,.22)'); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.fillRect(sx - 170, sy - 170, 340, 340);
    }
    ctx.globalCompositeOperation = 'source-over';

    // mắt quái phát sáng trong bóng tối
    ctx.save();
    ctx.translate(-cam.x + ox, -cam.y + oy);
    ctx.shadowColor = '#ff3b2a'; ctx.shadowBlur = 8; ctx.fillStyle = '#ff5a40';
    for (const mo of G.monsters) {
      if (!vis(mo)) continue;
      const lift = mo.T.flying ? -16 : 0, ca = Math.cos(mo.ang), sa = Math.sin(mo.ang), d = mo.r * 0.5;
      const ex = mo.x + ca * d, ey = mo.y + lift + sa * d, px = -sa * mo.r * 0.35, py = ca * mo.r * 0.35;
      circ(ex + px, ey + py, 1.9); circ(ex - px, ey - py, 1.9);
    }
    ctx.shadowBlur = 0;
    // chữ bay
    ctx.font = '700 14px "Alegreya Sans", system-ui, sans-serif'; ctx.textAlign = 'center';
    for (const t of G.FX.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // chỉ báo quái ngoài màn hình (giúp nhìn thấy hướng quái tới)
    if (P && G.state === 'play') {
      const cx = w / 2, cy = h / 2;
      for (const mo of G.monsters) {
        const sx = mo.x - cam.x, sy = mo.y - cam.y;
        if (sx > 0 && sx < w && sy > 0 && sy < h) continue;
        const dx = mo.x - P.x, dy = mo.y - P.y, d = Math.hypot(dx, dy);
        if (d > 1000) continue;
        const a = Math.atan2(dy, dx);
        const k = Math.min((w / 2 - 22) / Math.abs(Math.cos(a) || 1e-6), (h / 2 - 22) / Math.abs(Math.sin(a) || 1e-6));
        const ix = cx + Math.cos(a) * k, iy = cy + Math.sin(a) * k;
        ctx.save(); ctx.translate(ix, iy); ctx.rotate(a);
        ctx.globalAlpha = U.clamp(1.15 - d / 1000, 0.25, 0.9);
        ctx.fillStyle = mo.type === 'brute' ? '#ff8a5a' : '#e0453a';
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  };
})();
