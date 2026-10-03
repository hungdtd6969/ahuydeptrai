// Khởi động và vòng lặp chính
(function () {
  const canvas = document.getElementById('game');
  G.Render.init(canvas);
  G.Input.bind(canvas);
  G.UI.init();
  G.World.init();           // nền map hiện phía sau menu
  G.state = 'menu';
  try { G.Game.best = parseFloat(localStorage.getItem('rungdem_best') || '0') || 0; } catch (e) {}
  if (G.Game.best) {
    document.getElementById('bestText').textContent = 'Kỷ lục của bạn: ' + G.U.fmtTime(G.Game.best);
  }

  let prev = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    G.Render.updateCam();
    if (G.state === 'play') G.Game.update(dt);
    else if (G.state === 'dead') G.FX.update(dt);
    G.UI.update(dt);
    G.Render.draw();
    G.Input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
