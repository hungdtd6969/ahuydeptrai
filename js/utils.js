// Hàm tiện ích
G.U = {
  rand: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  angDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  },
  fmtTime(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  },
  dirName(a) {
    const names = ['Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc', 'Bắc', 'Đông Bắc'];
    const t = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return names[Math.round(t / (Math.PI / 4)) % 8];
  },
};
