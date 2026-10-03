// Chế tạo, nâng cấp vũ khí, đặt công trình
(function () {
  const C = G.CFG;
  const Craft = G.Craft = {
    canAfford(cost) {
      const inv = G.player.inv;
      return (!cost.wood || inv.wood >= cost.wood) && (!cost.stone || inv.stone >= cost.stone);
    },
    pay(cost) {
      const inv = G.player.inv;
      inv.wood -= cost.wood || 0; inv.stone -= cost.stone || 0;
    },
    upgradeCost(i) {
      const L = G.player.level[i], k = G.WEAPONS[i].tier;
      return { wood: Math.round((5 + 4 * L) * k), stone: Math.round((4 + 6 * L) * k) };
    },
    equip(i) {
      const P = G.player;
      if (!P.owned[i]) { G.UI.toast('Chưa có ' + G.WEAPONS[i].name + ' - mở bảng chế tạo (C)'); return; }
      P.eq = i; G.build.mode = null;
    },
    craft(i) {
      const P = G.player, w = G.WEAPONS[i];
      if (P.owned[i] || !w.cost) return;
      if (!this.canAfford(w.cost)) { G.UI.toast('Không đủ vật liệu'); return; }
      this.pay(w.cost); P.owned[i] = true; P.eq = i;
      G.Sfx.craft(); G.UI.toast('Đã chế tạo ' + w.name);
    },
    upgrade(i) {
      const P = G.player, w = G.WEAPONS[i];
      if (!P.owned[i] || P.level[i] >= G.MAX_LEVEL) return;
      const cost = this.upgradeCost(i);
      if (!this.canAfford(cost)) { G.UI.toast('Không đủ vật liệu'); return; }
      this.pay(cost); P.level[i]++; P.eq = i;
      G.Sfx.craft(); G.UI.toast(w.name + ' +' + P.level[i] + ' - sát thương ' + P.dmg(i));
      G.FX.burst(P.x, P.y, '#f0b25a', 14, 150, 0.6);
    },
    startBuild(mode) {
      G.build.mode = G.build.mode === mode ? null : mode;
      if (G.build.mode && !this.canAfford(G.BUILD[mode].cost)) G.UI.toast('Chưa đủ vật liệu cho ' + G.BUILD[mode].name.toLowerCase());
    },
    place(mode, g) {
      const def = G.BUILD[mode];
      this.pay(def.cost);
      if (mode === 'fire') G.World.addFire(g.x, g.y); else G.World.addWall(g.cx, g.cy, mode);
      G.Sfx.place();
      G.FX.burst(g.x, g.y, mode === 'wood' ? '#8a5f3a' : mode === 'stone' ? '#9aa1a6' : '#f0a04b', 8, 90, 0.4);
      if (!this.canAfford(def.cost)) { G.build.mode = null; G.UI.toast('Hết vật liệu'); }
    },
  };
})();
