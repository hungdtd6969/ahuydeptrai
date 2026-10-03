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
  MAX_MONSTERS: 80,
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
};

G.BUILD = {
  wood:  { name: 'Tường gỗ',  cost: { wood: 5 },            hp: 110, key: 'Z' },
  stone: { name: 'Tường đá',  cost: { stone: 6 },           hp: 360, key: 'X' },
  fire:  { name: 'Lửa trại',  cost: { wood: 6, stone: 4 },  hp: 0,   key: 'F' },
};
