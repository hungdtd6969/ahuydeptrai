// Giao diện HUD: thanh máu, tài nguyên, thanh vũ khí, bảng chế tạo, thông báo
(function () {
  const C = G.CFG, I = G.Input;
  const $ = (id) => document.getElementById(id);
  const UI = G.UI = {};
  let el = {}, last = {}, toastT = 0, bannerT = 0, panelOpen = false, sig = '';

  UI.init = function () {
    ['hpFill', 'hpPending', 'hpText', 'wood', 'stone', 'timer', 'kills', 'hotbar', 'craftBtn', 'craftPanel', 'toast', 'banner',
      'joyBase', 'joyKnob', 'atkBtn', 'cancelBuild', 'menu', 'gameover', 'startBtn', 'retryBtn', 'vignette', 'goStats', 'buildHint', 'bestText', 'bossBar', 'bossName', 'bossFill']
      .forEach((id) => { el[id] = $(id); });

    // thanh vũ khí
    el.hotbar.innerHTML = G.WEAPONS.map((w, i) =>
      '<button class="slot" data-i="' + i + '"><span class="k">' + (i + 1) + '</span><span class="n">' + w.name + '</span><span class="d"></span></button>').join('');
    el.hotbar.addEventListener('click', (e) => {
      const b = e.target.closest('.slot'); if (b) G.Craft.equip(+b.dataset.i);
    });

    el.craftBtn.addEventListener('click', () => UI.toggleCraft());
    el.craftPanel.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]'); if (!b || b.disabled) return;
      const i = +b.dataset.i;
      if (b.dataset.act === 'craft') G.Craft.craft(i);
      else if (b.dataset.act === 'up') G.Craft.upgrade(i);
      else if (b.dataset.act === 'build') { G.Craft.startBuild(b.dataset.m); if (G.build.mode && window.innerWidth < 700) UI.toggleCraft(false); }
      sig = '';
    });
    el.startBtn.addEventListener('click', () => G.Game.start());
    el.retryBtn.addEventListener('click', () => G.Game.start());
    el.cancelBuild.addEventListener('click', () => { G.build.mode = null; });

    // nút đánh trên điện thoại
    const atk = el.atkBtn;
    atk.addEventListener('pointerdown', (e) => { e.preventDefault(); I.touchAtk = true; I.touch = true; document.body.classList.add('touch'); atk.setPointerCapture && atk.setPointerCapture(e.pointerId); });
    const off = () => { I.touchAtk = false; };
    atk.addEventListener('pointerup', off); atk.addEventListener('pointercancel', off); atk.addEventListener('lostpointercapture', off);

    // Enter để bắt đầu / chơi lại
    addEventListener('keydown', (e) => { if (e.code === 'Enter' && G.state !== 'play') G.Game.start(); });
  };

  UI.toast = function (msg) { el.toast.textContent = msg; el.toast.classList.add('show'); toastT = 2.2; };
  UI.banner = function (msg) { el.banner.textContent = msg; el.banner.classList.add('show'); bannerT = 3.6; };
  UI.toggleCraft = function (force) {
    panelOpen = force === undefined ? !panelOpen : force;
    el.craftPanel.hidden = !panelOpen;
    el.craftBtn.classList.toggle('on', panelOpen);
    sig = '';
  };
  UI.onStart = function () {
    el.menu.hidden = true; el.gameover.hidden = true;
    document.body.classList.add('playing');
    UI.toggleCraft(false); last = {}; sig = '';
    UI.toast('Chặt cây (gỗ), đục đá, rồi mở bảng Chế tạo');
  };
  UI.onDead = function () {
    document.body.classList.remove('playing');
    const g = G.Game;
    el.goStats.innerHTML =
      '<div><b>' + G.U.fmtTime(g.time) + '</b><span>thời gian sống sót</span></div>' +
      '<div><b>' + g.kills + '</b><span>quái bị hạ</span></div>' +
      '<div><b>' + g.bossKills + '</b><span>trùm bị hạ</span></div>' +
      '<div><b>' + G.U.fmtTime(g.best) + '</b><span>kỷ lục</span></div>';
    el.gameover.hidden = false;
  };

  function weaponRows(P) {
    let h = '';
    for (let i = 1; i < G.WEAPONS.length; i++) {
      const w = G.WEAPONS[i];
      if (!P.owned[i]) {
        const ok = G.Craft.canAfford(w.cost);
        h += '<div class="row"><div class="info"><b>' + w.name + '</b><small>Sát thương ' + w.base + ' · tầm ' + w.range + '</small></div>' +
          '<button data-act="craft" data-i="' + i + '"' + (ok ? '' : ' disabled') + '>Chế tạo<em>' + costText(w.cost) + '</em></button></div>';
      } else {
        const L = P.level[i], max = L >= G.MAX_LEVEL;
        const cost = G.Craft.upgradeCost(i), ok = !max && G.Craft.canAfford(cost);
        h += '<div class="row"><div class="info"><b>' + w.name + (L ? ' +' + L : '') + '</b><small>Sát thương ' + P.dmg(i) +
          (max ? ' · cấp tối đa' : ' → ' + Math.round(w.base * (1 + G.LEVEL_BONUS * (L + 1)))) + '</small></div>' +
          '<button data-act="up" data-i="' + i + '"' + (ok ? '' : ' disabled') + '>' + (max ? 'Tối đa' : 'Nâng cấp') + '<em>' + (max ? '' : costText(cost)) + '</em></button></div>';
      }
    }
    return h;
  }
  function costText(c) { return [c.wood ? c.wood + ' gỗ' : '', c.stone ? c.stone + ' đá' : ''].filter(Boolean).join(' · '); }

  function refreshPanel(P) {
    const s = [P.inv.wood, P.inv.stone, P.owned.join(), P.level.join(), G.build.mode].join('|');
    if (s === sig) return;
    sig = s;
    let h = '<h3>Vũ khí</h3>' + weaponRows(P) + '<h3>Xây dựng</h3>';
    for (const k of ['wood', 'stone', 'fire']) {
      const b = G.BUILD[k], ok = G.Craft.canAfford(b.cost);
      h += '<div class="row"><div class="info"><b>' + b.name + '</b><small>' + (k === 'fire' ? 'Hồi máu và soi sáng' : 'Máu ' + b.hp + ' · phím ' + b.key) + '</small></div>' +
        '<button data-act="build" data-m="' + k + '"' + (ok ? '' : ' disabled') + (G.build.mode === k ? ' class="active"' : '') + '>' + (G.build.mode === k ? 'Đang đặt' : 'Đặt') + '<em>' + costText(b.cost) + '</em></button></div>';
    }
    el.craftPanel.innerHTML = h;
  }

  UI.update = function (dt) {
    const P = G.player;
    if (toastT > 0 && (toastT -= dt) <= 0) el.toast.classList.remove('show');
    if (bannerT > 0 && (bannerT -= dt) <= 0) el.banner.classList.remove('show');
    if (!P || G.state === 'menu') return;

    // thanh máu: phần "đang tụt" hiển thị riêng
    const hp = Math.max(0, P.hp), pend = Math.min(P.pending, hp);
    const hpPct = hp / C.MAX_HP * 100, pendPct = pend / C.MAX_HP * 100;
    const key = hpPct.toFixed(1) + '/' + pendPct.toFixed(1);
    if (last.hp !== key) {
      last.hp = key;
      el.hpFill.style.width = (hpPct - pendPct) + '%';
      el.hpPending.style.left = (hpPct - pendPct) + '%';
      el.hpPending.style.width = pendPct + '%';
      el.hpText.textContent = Math.ceil(hp - pend) + (pend > 0.5 ? '  (-' + Math.ceil(pend) + ')' : '');
      el.hpFill.parentNode.classList.toggle('low', hp - pend < 30);
    }
    el.vignette.style.opacity = Math.min(1, Math.max(0.0, (1 - (hp - pend) / C.MAX_HP) * 0.9 - 0.2) + Math.max(0, P.hurtT) * 0.8).toFixed(2);

    if (last.wood !== P.inv.wood) { last.wood = P.inv.wood; el.wood.textContent = P.inv.wood; }
    if (last.stone !== P.inv.stone) { last.stone = P.inv.stone; el.stone.textContent = P.inv.stone; }
    const t = G.U.fmtTime(G.Game.time);
    if (last.t !== t) { last.t = t; el.timer.textContent = t; }
    if (last.k !== G.Game.kills) { last.k = G.Game.kills; el.kills.textContent = G.Game.kills; }

    // thanh máu boss
    const bs = G.boss;
    if (bs && G.state === 'play') {
      const f = Math.max(0, bs.hp / bs.maxHp), k = bs.type + (bs.rage ? 'r' : '') + Math.round(f * 300);
      if (last.bs !== k) {
        last.bs = k; el.bossBar.hidden = false;
        el.bossName.textContent = bs.T.name + (bs.rage ? ' - nổi điên' : '');
        el.bossFill.style.width = (f * 100) + '%';
        el.bossBar.classList.toggle('rage', bs.rage);
      }
    } else if (last.bs) { last.bs = ''; el.bossBar.hidden = true; }

    // thanh vũ khí
    const hs = P.owned.join() + P.level.join() + P.eq;
    if (last.hs !== hs) {
      last.hs = hs;
      el.hotbar.querySelectorAll('.slot').forEach((b, i) => {
        b.classList.toggle('locked', !P.owned[i]); b.classList.toggle('sel', P.eq === i);
        b.querySelector('.d').textContent = P.owned[i] ? 'ST ' + P.dmg(i) + (P.level[i] ? '  +' + P.level[i] : '') : 'chưa có';
      });
    }
    if (panelOpen) refreshPanel(P);

    // chế độ xây
    const bm = G.build.mode;
    if (last.bm !== bm) {
      last.bm = bm;
      el.cancelBuild.hidden = !bm;
      el.buildHint.hidden = !bm;
      if (bm) el.buildHint.textContent = 'Đang đặt: ' + G.BUILD[bm].name + ' - bấm/kéo để đặt, chuột phải hoặc Esc để thôi';
      if (panelOpen) sig = '';
    }
    // joystick ảo
    const j = I.joy;
    el.joyBase.style.display = j.active ? 'block' : 'none';
    if (j.active) {
      el.joyBase.style.left = j.ox + 'px'; el.joyBase.style.top = j.oy + 'px';
      el.joyKnob.style.transform = 'translate(' + j.kx + 'px,' + j.ky + 'px)';
    }
  };
})();
