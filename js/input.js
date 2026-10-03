// Bàn phím, chuột, cảm ứng (joystick ảo bên trái, chạm bên phải để đặt công trình)
(function () {
  const I = G.Input = {
    keys: {}, pressed: {},
    mouse: { x: 0, y: 0, down: false, active: false, clicked: false, rightClick: false },
    joy: { x: 0, y: 0, active: false, id: null, ox: 0, oy: 0, kx: 0, ky: 0 },
    touch: false, touchAtk: false, tap: null, aim: null,
  };
  const BLOCK = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  addEventListener('keydown', (e) => {
    if (BLOCK.indexOf(e.code) >= 0) e.preventDefault();
    if (!e.repeat) I.pressed[e.code] = true;
    I.keys[e.code] = true;
  });
  addEventListener('keyup', (e) => { I.keys[e.code] = false; });
  addEventListener('blur', () => { I.keys = {}; I.mouse.down = false; I.touchAtk = false; });

  I.bind = function (canvas) {
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') {
        I.touch = false; document.body.classList.remove('touch');
        I.mouse.active = true; I.mouse.x = e.clientX; I.mouse.y = e.clientY;
        if (e.button === 0) { I.mouse.down = true; I.mouse.clicked = true; }
        else if (e.button === 2) I.mouse.rightClick = true;
      } else {
        I.touch = true; document.body.classList.add('touch');
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        if (e.clientX < innerWidth * 0.5 && !I.joy.active) {
          I.joy.active = true; I.joy.id = e.pointerId;
          I.joy.ox = e.clientX; I.joy.oy = e.clientY; I.joy.x = I.joy.y = 0; I.joy.kx = I.joy.ky = 0;
        } else {
          I.tap = { x: e.clientX, y: e.clientY };
        }
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') { I.mouse.x = e.clientX; I.mouse.y = e.clientY; I.mouse.active = true; }
      else if (I.joy.active && e.pointerId === I.joy.id) {
        let dx = e.clientX - I.joy.ox, dy = e.clientY - I.joy.oy;
        const max = 55, d = Math.hypot(dx, dy);
        if (d > max) { dx = dx / d * max; dy = dy / d * max; }
        I.joy.kx = dx; I.joy.ky = dy;
        I.joy.x = dx / max; I.joy.y = dy / max;
      }
    });
    const up = (e) => {
      if (e.pointerType === 'mouse') { if (e.button === 0) I.mouse.down = false; }
      else if (I.joy.active && e.pointerId === I.joy.id) {
        I.joy.active = false; I.joy.x = I.joy.y = 0; I.joy.id = null;
      }
    };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  };

  I.endFrame = function () {
    I.pressed = {};
    I.mouse.clicked = false; I.mouse.rightClick = false;
    I.tap = null;
  };
})();
