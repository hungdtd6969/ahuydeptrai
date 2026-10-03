// Cấu hình và dữ liệu chung của game. Mọi module gắn vào đối tượng toàn cục G.
window.G = {
  state: 'menu',
  shake: 0,
  cam: { x: 0, y: 0 },
  build: { mode: null, ghost: null, cool: 0 },
  monsters: [],
  proj: [],
  player: null,
};

G.CFG = {
  WORLD: 2800,        // kích thước map (px)
  CELL: 40,           // ô lưới đặt tường
  PLAYER_R: 14,
  PLAYER_SPEED: 185,
  MAX_HP: 100,
  DRAIN: 12,          // máu tụt dần: 12 máu mỗi giây cho phần sát thương đang "chờ"
  REACH: 230,         // tầm đặt công trình
  LIGHT: 285,         // bán kính ánh sáng quanh người chơi
  DARK: 0.76,         // độ tối của map (0 = sáng, 1 = đen kịt)
  TREES: 170,
  ROCKS: 80,
  MAX_MONSTERS: 130,
  FIRE_HEAL: 2.5,     // hồi máu/giây gần lửa trại
  FIRE_RANGE: 115,
};

G.WEAPONS = [
  { id: 'fist',  name: 'Tay không', base: 6,  range: 48,  cd: 0.45, arc: 2.1, gW: 1, gS: 1, tier: 0,   cost: null },
  { id: 'club',  name: 'Gậy gỗ',    base: 12, range: 58,  cd: 0.42, arc: 2.2, gW: 2, gS: 1, tier: 0.8, cost: { wood: 8 } },
  { id: 'knife', name: 'Dao đá',    base: 19, range: 60,  cd: 0.36, arc: 2.0, gW: 2, gS: 2, tier: 1,   cost: { wood: 8, stone: 10 } },
  { id: 'axe',   name: 'Rìu chiến', base: 32, range: 66,  cd: 0.52, arc: 2.6, gW: 4, gS: 3, tier: 1.4, cost: { wood: 18, stone: 24 } },
  { id: 'spear', name: 'Giáo đá',   base: 26, range: 104, cd: 0.46, arc: 0.8, gW: 1, gS: 2, tier: 1.2, cost: { wood: 12, stone: 18 } },
];
G.MAX_LEVEL = 5;
G.LEVEL_BONUS = 0.35; // mỗi cấp nâng +35% sát thương gốc

G.MONSTERS = {
  zombie:  { name: 'Xác sống', hp: 42,  speed: 58,  dmg: 10, r: 14, atkCd: 1.0, kb: 150, wallMul: 1,   color: '#5f8a4d' },
  runner:  { name: 'Thú săn',  hp: 24,  speed: 135, dmg: 7,  r: 11, atkCd: 0.7, kb: 200, wallMul: 0.6, color: '#d1763f' },
  brute:   { name: 'Quỷ đá',   hp: 150, speed: 40,  dmg: 22, r: 23, atkCd: 1.4, kb: 60,  wallMul: 3,   color: '#8a5560' },
  spitter: { name: 'Quái độc', hp: 32,  speed: 52,  dmg: 9,  r: 13, atkCd: 1.0, kb: 160, wallMul: 0.5, color: '#b6c93c', ranged: true, shootCd: 2.2 },
  bat:     { name: 'Dơi đêm',  hp: 16,  speed: 150, dmg: 6,  r: 10, atkCd: 0.8, kb: 220, wallMul: 0,   color: '#8a6cc0', flying: true },

  // ---- Quái mới ----
  crawler: { name: 'Nhện đêm',  hp: 14,  speed: 125, dmg: 5,  r: 8,  atkCd: 0.6, kb: 260, wallMul: 0.3, color: '#6a7480', zig: 0.6, pack: 4 },           // đi theo bầy
  ghost:   { name: 'Ma rừng',   hp: 30,  speed: 72,  dmg: 8,  r: 12, atkCd: 1.0, kb: 90,  wallMul: 0,   color: '#9ad0e0', phase: true },              // xuyên tường
  bomber:  { name: 'Quái nổ',   hp: 20,  speed: 108, dmg: 26, r: 12, atkCd: 1.0, kb: 200, wallMul: 0,   color: '#d8a030', explode: true },           // lao vào rồi nổ, phá tường
  archer:  { name: 'Xương cung', hp: 28, speed: 62,  dmg: 11, r: 12, atkCd: 1.0, kb: 160, wallMul: 0.5, color: '#d8d0b0', ranged: true, shootCd: 1.7, ps: 330, pc: '#e8dcc0', near: 230, far: 330 },
  slime:   { name: 'Nhầy',      hp: 52,  speed: 50,  dmg: 9,  r: 16, atkCd: 1.0, kb: 140, wallMul: 0.8, color: '#4fb3a0', split: 'slimeS' },            // chết tách thành 3 con
  slimeS:  { name: 'Nhầy con',  hp: 14,  speed: 88,  dmg: 5,  r: 9,  atkCd: 0.8, kb: 220, wallMul: 0.3, color: '#6fd0bc' },
  charger: { name: 'Heo rừng',  hp: 95,  speed: 54,  dmg: 20, r: 17, atkCd: 1.1, kb: 90,  wallMul: 2.5, color: '#8a6a3a',
             dash: { min: 90, range: 380, wind: 0.8, dur: 0.6, speed: 400, cd: 2.6 } },                                                              // báo hiệu rồi húc thẳng
  shaman:  { name: 'Pháp sư',   hp: 42,  speed: 46,  dmg: 9,  r: 13, atkCd: 1.0, kb: 130, wallMul: 0.5, color: '#c060b0', ranged: true, shootCd: 2.6, ps: 200, pc: '#e08aff', near: 260, far: 340, healer: true },

  // ---- Boss ----
  boss_golem: { name: 'Chúa Quỷ Đá',   boss: true, hp: 950, speed: 38,  dmg: 30, r: 40, atkCd: 1.5, kb: 10, wallMul: 4,   color: '#7a4a58', minion: { type: 'zombie',  n: 3, every: 11 } },
  boss_queen: { name: 'Nữ Hoàng Nhện', boss: true, hp: 760, speed: 72,  dmg: 20, r: 30, atkCd: 1.0, kb: 20, wallMul: 1.5, color: '#5a2a6a', minion: { type: 'crawler', n: 5, every: 10 } },
  boss_boar:  { name: 'Heo Rừng Chúa', boss: true, hp: 850, speed: 62,  dmg: 26, r: 33, atkCd: 1.2, kb: 15, wallMul: 5,   color: '#9a5a2a', minion: { type: 'runner',  n: 3, every: 9 },
                dash: { min: 120, range: 560, wind: 1.0, dur: 0.9, speed: 520, cd: 2.4 } },
  boss_lich:  { name: 'Vua Xương Ma',  boss: true, hp: 650, speed: 52,  dmg: 18, r: 24, atkCd: 1.0, kb: 30, wallMul: 0,   color: '#d8d2bc', phase: true, minion: { type: 'ghost', n: 3, every: 12 } },
  boss_bat:   { name: 'Dơi Chúa',      boss: true, hp: 600, speed: 105, dmg: 18, r: 26, atkCd: 0.9, kb: 30, wallMul: 0,   color: '#8a6cc0', flying: true, minion: { type: 'bat', n: 5, every: 10 },
                dash: { min: 100, range: 520, wind: 0.7, dur: 0.75, speed: 470, cd: 3.2 } },
};
G.BOSS_ORDER = ['boss_golem', 'boss_queen', 'boss_boar', 'boss_lich', 'boss_bat'];

G.BUILD = {
  wood:  { name: 'Tường gỗ',  cost: { wood: 5 },            hp: 110, key: 'Z' },
  stone: { name: 'Tường đá',  cost: { stone: 6 },           hp: 360, key: 'X' },
  fire:  { name: 'Lửa trại',  cost: { wood: 6, stone: 4 },  hp: 0,   key: 'F' },
};
