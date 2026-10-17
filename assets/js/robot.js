// Dual-arm mobile manipulator: one arm picks a block, hands it over, the other places it.
// Each cycle alternates direction. Arm poses come from 2-link inverse kinematics.
(function () {
  var svg = document.getElementById('robot-anim');
  if (!svg) return;

  var L1 = 78, L2 = 72;             // link lengths
  var CX = 410;                     // mirror axis
  var SHOULDER = { left: [380, 72], right: [440, 72] };
  var HEAD = [410, 52];
  var D = Math.PI / 2;              // gripper pointing down
  var PERIOD = 9;                   // seconds per hand-off

  // Canonical cycle: left arm gives, right arm receives. [t, x, y, phi, grip(1 open, 0 closed)]
  var GIVER = [
    [0, 330, 120, D, 1], [1.2, 250, 108, D, 1], [1.8, 250, 138, D, 1], [2.1, 250, 138, D, 0],
    [2.7, 250, 108, D, 0], [4.0, 416, 100, 0, 0], [4.3, 416, 100, 0, 0], [4.6, 416, 100, 0, 1],
    [5.6, 330, 120, D, 1], [9, 330, 120, D, 1]
  ];
  var RECEIVER = [
    [0, 490, 120, D, 1], [2.9, 490, 120, D, 1], [4.0, 404, 100, Math.PI, 1], [4.3, 404, 100, Math.PI, 0],
    [4.6, 404, 100, Math.PI, 0], [6.0, 570, 108, D, 0], [6.6, 570, 138, D, 0], [6.9, 570, 138, D, 1],
    [7.5, 570, 108, D, 1], [8.6, 490, 120, D, 1], [9, 490, 120, D, 1]
  ];

  function ease(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

  function sample(track, t) {
    for (var i = 1; i < track.length; i++) {
      if (t <= track[i][0]) {
        var a = track[i - 1], b = track[i];
        var u = ease((t - a[0]) / (b[0] - a[0] || 1));
        return { x: a[1] + (b[1] - a[1]) * u, y: a[2] + (b[2] - a[2]) * u,
                 phi: a[3] + (b[3] - a[3]) * u, grip: a[4] + (b[4] - a[4]) * u };
      }
    }
    var l = track[track.length - 1];
    return { x: l[1], y: l[2], phi: l[3], grip: l[4] };
  }

  function held(s) { return { x: s.x - 6 * Math.cos(s.phi), y: s.y - 6 * Math.sin(s.phi) }; }  // between the fingers
  function mirror(s) { return { x: 2 * CX - s.x, y: s.y, phi: Math.PI - s.phi, grip: s.grip }; }

  // Elbow solution: sign +1 keeps the elbow outward for the left arm, -1 for the right arm.
  function ik(S, W, sign) {
    var dx = W[0] - S[0], dy = W[1] - S[1];
    var d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1e-3), L1 + L2 - 1e-3);
    var a = Math.atan2(dy, dx);
    var b = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
    var q = a + sign * b;
    return [S[0] + L1 * Math.cos(q), S[1] + L1 * Math.sin(q)];
  }

  function el(id) { return svg.querySelector('[data-part="' + id + '"]'); }
  var parts = {};
  ['left', 'right'].forEach(function (side) {
    parts[side] = { link: el(side + '-link'), elbow: el(side + '-elbow'), wrist: el(side + '-wrist'), grip: el(side + '-grip') };
  });
  var cube = el('cube'), head = el('head');

  function drawArm(side, s, sign) {
    var S = SHOULDER[side], c = Math.cos(s.phi), n = Math.sin(s.phi);
    var W = [s.x - 22 * c, s.y - 22 * n];
    var E = ik(S, W, sign);
    var p = parts[side];
    p.link.setAttribute('d', 'M' + S + 'L' + E + 'L' + W);
    p.elbow.setAttribute('cx', E[0]); p.elbow.setAttribute('cy', E[1]);
    p.wrist.setAttribute('cx', W[0]); p.wrist.setAttribute('cy', W[1]);
    var P = [W[0] + 8 * c, W[1] + 8 * n], w = 8 + 4 * s.grip, nx = -n * w, ny = c * w;
    var A = [P[0] + nx, P[1] + ny], B = [P[0] - nx, P[1] - ny];
    p.grip.setAttribute('d', 'M' + W + 'L' + P + 'M' + A + 'L' + B +
      'M' + A + 'l' + 14 * c + ',' + 14 * n + 'M' + B + 'l' + 14 * c + ',' + 14 * n);
  }

  function frame(time) {
    var cycle = Math.floor(time / PERIOD), t = time - cycle * PERIOD;
    var g = sample(GIVER, t), r = sample(RECEIVER, t), box;
    if (t < 2.1) box = { x: 250, y: 132 };
    else if (t < 4.3) box = held(g);
    else if (t < 6.9) box = held(r);
    else box = { x: 570, y: 132 };

    var left = g, right = r;
    if (cycle % 2) { left = mirror(r); right = mirror(g); box = { x: 2 * CX - box.x, y: box.y }; }
    drawArm('left', left, 1);
    drawArm('right', right, -1);
    cube.setAttribute('transform', 'translate(' + (box.x - 7) + ' ' + (box.y - 7) + ')');
    // Head tilts toward the block (symmetric stereo camera, so it only needs to tilt).
    var dx = box.x - HEAD[0], tilt = Math.min(55, Math.atan2(box.y - HEAD[1], Math.abs(dx)) * 180 / Math.PI);
    var look = tilt * Math.max(-1, Math.min(1, dx / 40));
    head.setAttribute('transform', 'rotate(' + look.toFixed(1) + ' ' + HEAD + ')');
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fixed = /[?&]robot_t=([\d.]+)/.exec(location.search);   // ?robot_t=4.2 freezes a pose
  if (reduce || fixed) { frame(fixed ? +fixed[1] : 4.15); return; }

  var start = null, visible = true, raf = null;
  function loop(now) {
    if (start === null) start = now;
    frame((now - start) / 1000);
    raf = visible ? requestAnimationFrame(loop) : null;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && raf === null) raf = requestAnimationFrame(loop);
    }).observe(svg);
  }
  frame(0);
  raf = requestAnimationFrame(loop);
})();
