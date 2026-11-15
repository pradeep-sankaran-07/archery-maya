import * as THREE from 'three';
import { toon } from './models.js';
import { HL, HW, GOAL_HW, GOAL_H, GOAL_D, FENCE_X, FENCE_Z, BOX_D, BOX_HW } from '../game/constants.js';

function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function pitchTexture(theme) {
  const FX = FENCE_X, FZ = FENCE_Z;
  const W = 2048, H = Math.round(2048 * FZ / FX);
  const sx = W / (2 * FX), sz = H / (2 * FZ);
  const px = (x) => (x + FX) * sx;
  const pz = (z) => (z + FZ) * sz;
  return canvasTex(W, H, (c) => {
    const g1 = theme === 'circus' ? '#3f9b45' : '#4fb04f';
    const g2 = theme === 'circus' ? '#378c3d' : '#45a046';
    c.fillStyle = g1; c.fillRect(0, 0, W, H);
    const stripes = 14;
    for (let i = 0; i < stripes; i++) {
      if (i % 2) continue;
      c.fillStyle = g2;
      c.fillRect(px(-HL + (i * 2 * HL) / stripes), 0, (2 * HL / stripes) * sx, H);
    }
    // speckles for texture
    for (let i = 0; i < 6000; i++) {
      c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      c.fillRect(Math.random() * W, Math.random() * H, 3, 3);
    }
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.lineWidth = 0.14 * sx;
    c.strokeRect(px(-HL), pz(-HW), 2 * HL * sx, 2 * HW * sz);
    c.beginPath(); c.moveTo(px(0), pz(-HW)); c.lineTo(px(0), pz(HW)); c.stroke();
    c.beginPath(); c.ellipse(px(0), pz(0), 4.5 * sx, 4.5 * sz, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(px(0), pz(0), 0.25 * sx, 0.25 * sz, 0, 0, Math.PI * 2); c.fill();
    for (const s of [-1, 1]) {
      const gx = s * HL;
      c.strokeRect(Math.min(px(gx), px(gx - s * BOX_D)), pz(-BOX_HW), BOX_D * sx, 2 * BOX_HW * sz);
      c.strokeRect(Math.min(px(gx), px(gx - s * 2.5)), pz(-GOAL_HW - 1), 2.5 * sx, (2 * GOAL_HW + 2) * sz);
      c.beginPath(); c.ellipse(px(gx - s * 5), pz(0), 0.22 * sx, 0.22 * sz, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(px(gx - s * BOX_D), pz(0), 3 * sx, 3 * sz, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, s > 0 ? Math.PI * 1.5 : Math.PI / 2); c.stroke();
    }
    // run-off area colour
    c.fillStyle = theme === 'circus' ? '#b8864a' : '#c9a35c';
    c.globalCompositeOperation = 'destination-over';
  });
}

function buildGoal(side) {
  const g = new THREE.Group();
  const white = toon(0xffffff);
  const r = 0.07;
  const post = new THREE.CylinderGeometry(r, r, GOAL_H, 10);
  for (const z of [-GOAL_HW, GOAL_HW]) {
    const p = new THREE.Mesh(post, white);
    p.position.set(0, GOAL_H / 2, z);
    g.add(p);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, GOAL_HW * 2 + r * 2, 10), white);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0, GOAL_H, 0);
  g.add(bar);
  // back frame
  const thin = toon(0xdddddd);
  for (const z of [-GOAL_HW, GOAL_HW]) {
    const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, GOAL_H * 0.8, 6), thin);
    bp.position.set(GOAL_D, GOAL_H * 0.4, z);
    g.add(bp);
  }
  // net lines
  const pts = [];
  const step = 0.25;
  const D = GOAL_D, Hh = GOAL_H, Wz = GOAL_HW;
  const backH = (x) => Hh - (Hh * 0.2) * (x / D);
  for (let z = -Wz; z <= Wz + 1e-6; z += step) { // back verticals + roof lines
    pts.push(D, 0, z, D, backH(D), z);
    pts.push(0, Hh, z, D, backH(D), z);
  }
  for (let y = 0; y <= Hh + 1e-6; y += step) { // back horizontals
    const yy = Math.min(y, backH(D));
    pts.push(D, yy, -Wz, D, yy, Wz);
  }
  for (const z of [-Wz, Wz]) { // side nets
    for (let x = 0; x <= D + 1e-6; x += step) pts.push(x, 0, z, x, backH(x), z);
    for (let y = 0; y <= Hh + 1e-6; y += step) pts.push(0, y, z, D, Math.min(y, backH(D)), z);
  }
  for (let x = 0; x <= D + 1e-6; x += step) pts.push(x, backH(x), -Wz, x, backH(x), Wz);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const net = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
  g.add(net);
  g.position.set(side * HL, 0, 0);
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}

function boardTexture(theme) {
  return canvasTex(1024, 64, (c, w, h) => {
    const cols = theme === 'circus'
      ? ['#e53935', '#fff3e0', '#ffc94a', '#1e3a8a']
      : ['#7b1fa2', '#ffc94a', '#00897b', '#d84315'];
    const words = theme === 'circus'
      ? ['🎪 BIG TOP', '⚽ FOOTBALL BLAH-BLAH', '🐘 CIRCUS', '🎩 SHOWTIME']
      : ['🪔 AGRABAH', '⚽ FOOTBALL BLAH-BLAH', '🧞 GENIE FC', '🐯 RAJAH'];
    const seg = w / 4;
    for (let i = 0; i < 4; i++) {
      c.fillStyle = cols[i]; c.fillRect(i * seg, 0, seg, h);
      c.fillStyle = (cols[i] === '#fff3e0' || cols[i] === '#ffc94a') ? '#3a1f5e' : '#ffffff';
      c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(words[i], i * seg + seg / 2, h / 2 + 2);
    }
  });
}

function fenceTexture() {
  const t = canvasTex(64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.strokeStyle = 'rgba(230,230,240,0.85)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function buildFence(theme) {
  const g = new THREE.Group();
  const boardTex = boardTexture(theme);
  boardTex.wrapS = THREE.RepeatWrapping;
  const bh = 0.8;
  const sideLen = FENCE_X * 2;
  const endLen = FENCE_Z * 2;
  const mkBoard = (len, reps) => {
    const t = boardTex.clone(); t.needsUpdate = true; t.repeat.set(reps, 1); t.wrapS = THREE.RepeatWrapping;
    return new THREE.Mesh(new THREE.BoxGeometry(len, bh, 0.12), [toon(0x333344), toon(0x333344), toon(0x333344), toon(0x333344), new THREE.MeshBasicMaterial({ map: t }), new THREE.MeshBasicMaterial({ map: t })]);
  };
  for (const s of [-1, 1]) {
    const b = mkBoard(sideLen, 4);
    b.position.set(0, bh / 2, s * FENCE_Z);
    g.add(b);
    // end boards on the goal line, either side of the goal
    const segLen = FENCE_Z - GOAL_HW - 0.1;
    for (const zs of [-1, 1]) {
      const e = mkBoard(segLen, 1);
      e.rotation.y = Math.PI / 2;
      e.position.set(s * (HL + 0.25), bh / 2, zs * (GOAL_HW + 0.1 + segLen / 2));
      g.add(e);
    }
    // short side boards joining the goal-line boards to the back fence
    for (const zs of [-1, 1]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(FENCE_X - HL, bh, 0.12), toon(0x333344));
      c.position.set(s * (HL + (FENCE_X - HL) / 2 + 0.2), bh / 2, zs * (GOAL_HW + 0.15));
      g.add(c);
    }
    const back = mkBoard(GOAL_HW * 2 + 0.3, 0.3);
    back.rotation.y = Math.PI / 2;
    back.position.set(s * FENCE_X, bh / 2, 0);
    g.add(back);
  }
  // tall mesh fence behind each goal
  const ft = fenceTexture();
  ft.repeat.set(endLen / 0.6, 3.2 / 0.6);
  const fenceMat = new THREE.MeshBasicMaterial({ map: ft, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(endLen, 3.2), fenceMat);
    f.rotation.y = Math.PI / 2;
    f.position.set(s * (FENCE_X + 0.05), bh + 1.6, 0);
    g.add(f);
    for (let z = -FENCE_Z; z <= FENCE_Z + 0.01; z += endLen / 6) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), toon(0x666677));
      p.position.set(s * (FENCE_X + 0.05), 2, z);
      g.add(p);
    }
  }
  return g;
}

function skyDome(top, bottom) {
  const geo = new THREE.SphereGeometry(400, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ float k = smoothstep(-0.05, 0.6, h); gl_FragColor = vec4(mix(bottom, top, k), 1.0); }',
  });
  return new THREE.Mesh(geo, mat);
}

// Crowd: instanced bodies + heads, bouncing.
function buildCrowd(spots) {
  const n = spots.length;
  const bodyGeo = new THREE.CapsuleGeometry(0.28, 0.45, 3, 8);
  const headGeo = new THREE.SphereGeometry(0.22, 10, 8);
  const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial(), n);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xf0c090 }), n);
  const colors = [0xff5a5f, 0xffc94a, 0x4a90e2, 0x4caf50, 0xff7eb3, 0x8b5fbf, 0xffffff, 0xff9f43, 0x00b8a9];
  const skins = [0xf5c89a, 0xe0a878, 0xc68654, 0x8d5a3b, 0xffdcb8];
  const col = new THREE.Color();
  spots.forEach((s, i) => {
    bodies.setColorAt(i, col.setHex(colors[(Math.random() * colors.length) | 0]));
    heads.setColorAt(i, col.setHex(skins[(Math.random() * skins.length) | 0]));
  });
  const m = new THREE.Matrix4();
  const phase = spots.map(() => Math.random() * Math.PI * 2);
  let excite = 0;
  const update = (time, dt) => {
    excite = Math.max(0, excite - dt * 0.4);
    for (let i = 0; i < n; i++) {
      const s = spots[i];
      const bounce = Math.max(0, Math.sin(time * (3 + excite * 6) + phase[i])) * (0.06 + excite * 0.5);
      m.makeTranslation(s.x, s.y + 0.5 + bounce, s.z);
      bodies.setMatrixAt(i, m);
      m.makeTranslation(s.x, s.y + 1.05 + bounce, s.z);
      heads.setMatrixAt(i, m);
    }
    bodies.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
  };
  update(0, 0);
  const g = new THREE.Group();
  g.add(bodies, heads);
  g.userData.update = update;
  g.userData.cheer = () => { excite = 1; };
  return g;
}

function standSpots(cx, cz, len, rows, along = 'x', facing = 1, baseY = 0) {
  const spots = [];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < len / 0.9; i++) {
      if (Math.random() < 0.18) continue;
      const a = -len / 2 + i * 0.9 + (Math.random() - 0.5) * 0.2;
      const off = r * 1.1 * facing;
      const y = baseY + r * 0.75;
      spots.push(along === 'x' ? { x: cx + a, y, z: cz + off } : { x: cx + off, y, z: cz + a });
    }
  }
  return spots;
}

function buildStand(cx, cz, len, rows, along, facing, color) {
  const g = new THREE.Group();
  for (let r = 0; r < rows; r++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? len : 1.1, 0.75 * (r + 1), along === 'x' ? 1.1 : len), toon(r % 2 ? color : shadeHex(color, 0.85)));
    const off = r * 1.1 * facing;
    step.position.set(along === 'x' ? cx : cx + off, 0.375 * (r + 1) - 0.75, along === 'x' ? cz + off : cz);
    g.add(step);
  }
  return g;
}
function shadeHex(hex, f) { const c = new THREE.Color(hex); c.multiplyScalar(f); return c.getHex(); }

function palmTree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunkMat = toon(0x8d6e4a);
  let px = 0, py = 0;
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.22 - i * 0.015, 0.26 - i * 0.015, 1.1, 8), trunkMat);
    px += 0.08 * i * 0.3; py += 1.0;
    seg.position.set(px, py - 0.5, 0);
    seg.rotation.z = -0.05 * i;
    g.add(seg);
  }
  const leafMat = toon(0x2e8b3a);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.2, 4), leafMat);
    leaf.scale.set(1, 1, 0.25);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(px + Math.cos(a) * 1.3, py - 0.2, Math.sin(a) * 1.3);
    leaf.rotation.set(Math.sin(a) * 1.1, -a, -Math.cos(a) * 1.1 + Math.PI / 2 * 0);
    leaf.lookAt(px + Math.cos(a) * 4, py - 1.6, Math.sin(a) * 4);
    leaf.rotateX(Math.PI / 2);
    g.add(leaf);
  }
  const coco = toon(0x5d4037);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), coco);
    c.position.set(px + Math.cos(i * 2) * 0.25, py - 0.4, Math.sin(i * 2) * 0.25);
    g.add(c);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  return g;
}

function onionDome(r, color) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const y = t * r * 2.4;
    const rad = r * Math.sin(Math.min(1, t * 1.25) * Math.PI) * (1 - t * 0.3) + (t > 0.9 ? 0 : 0.0);
    pts.push(new THREE.Vector2(Math.max(0.01, rad), y));
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 20), toon(color)));
  const spire = new THREE.Mesh(new THREE.ConeGeometry(r * 0.08, r * 0.9, 8), toon(0xffc94a));
  spire.position.y = r * 2.5;
  g.add(spire);
  return g;
}

function buildPalace() {
  const g = new THREE.Group();
  const wall = toon(0xf5e6c8);
  const trim = toon(0xd4a24c);
  const base = new THREE.Mesh(new THREE.BoxGeometry(36, 9, 10), wall);
  base.position.y = 4.5;
  g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 8), wall);
  top.position.y = 12;
  g.add(top);
  const band = new THREE.Mesh(new THREE.BoxGeometry(36.4, 0.6, 10.4), trim);
  band.position.y = 9;
  g.add(band);
  const dome = onionDome(5.5, 0xffc94a);
  dome.position.y = 15;
  g.add(dome);
  for (const x of [-15, 15]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 18, 14), wall);
    tower.position.set(x, 9, 0);
    g.add(tower);
    const d = onionDome(2.4, 0x26a69a);
    d.position.set(x, 18, 0);
    g.add(d);
  }
  for (const x of [-9, 9]) {
    const d = onionDome(2.2, 0x26a69a);
    d.position.set(x, 15, 0);
    g.add(d);
  }
  const dark = toon(0x5a3a2a);
  for (let i = -3; i <= 3; i++) {
    const arch = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 0.3), dark);
    arch.position.set(i * 4.4, 3, 5.05);
    g.add(arch);
    const archTop = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 12, 1, false, 0, Math.PI), dark);
    archTop.rotation.x = Math.PI / 2;
    archTop.rotation.y = Math.PI / 2;
    archTop.position.set(i * 4.4, 4.75, 5.05);
    g.add(archTop);
  }
  return g;
}

function marketTent(x, z, color) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 4), toon(color));
  top.position.y = 3.2;
  top.rotation.y = Math.PI / 4;
  g.add(top);
  for (const [px, pz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), toon(0x8d6e4a));
    p.position.set(px, 1.3, pz);
    g.add(p);
  }
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.2), toon(0x8d6e4a));
  table.position.y = 0.4;
  g.add(table);
  const fruit = [0xff7043, 0xffee58, 0x66bb6a, 0xab47bc];
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), toon(fruit[i % 4]));
    f.position.set(-0.8 + i * 0.32, 0.92, (i % 2) * 0.3 - 0.15);
    g.add(f);
  }
  g.position.set(x, 0, z);
  return g;
}

/** Build the whole world for a theme. Returns { group, update(time, dt), crowd, lights }. */
export function buildStadium(theme) {
  const root = new THREE.Group();
  const updaters = [];
  const isCircus = theme === 'circus';

  root.add(skyDome(isCircus ? 0x12082e : 0x5b6fd6, isCircus ? 0x4a1a5e : 0xffc08a));

  const outer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), toon(isCircus ? 0xa8743e : 0xe3bd76));
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.02;
  root.add(outer);

  const pt = pitchTexture(theme);
  pt.anisotropy = 4;
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(FENCE_X * 2, FENCE_Z * 2), new THREE.MeshLambertMaterial({ map: pt }));
  pitch.rotation.x = -Math.PI / 2;
  root.add(pitch);

  root.add(buildGoal(1));
  root.add(buildGoal(-1));
  root.add(buildFence(theme));

  // Stands: far side (always visible), and behind both goals.
  const standColor = isCircus ? 0xb71c1c : 0x8d6e63;
  root.add(buildStand(0, -FENCE_Z - 2.2, 40, 5, 'x', -1, standColor));
  const spots = [
    ...standSpots(0, -FENCE_Z - 2.2, 39, 5, 'x', -1, 0),
  ];
  for (const s of [-1, 1]) {
    root.add(buildStand(s * (FENCE_X + 2.6), 0, 26, 4, 'z', s, standColor));
    spots.push(...standSpots(s * (FENCE_X + 2.6), 0, 25, 4, 'z', s, 0));
  }
  if (isCircus) {
    root.add(buildStand(0, FENCE_Z + 3, 40, 3, 'x', 1, standColor));
    spots.push(...standSpots(0, FENCE_Z + 3, 39, 3, 'x', 1, 0));
  }
  const crowd = buildCrowd(spots);
  root.add(crowd);
  updaters.push(crowd.userData.update);

  const lights = new THREE.Group();
  root.add(lights);

  if (!isCircus) {
    const hemi = new THREE.HemisphereLight(0xfff3e0, 0x9a7a50, 1.9);
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
    sun.position.set(-20, 40, 25);
    lights.add(hemi, sun);
    const palace = buildPalace();
    palace.position.set(0, 0, -62);
    root.add(palace);
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(14, 32), new THREE.MeshBasicMaterial({ color: 0xffe9a0, fog: false }));
    sunDisc.position.set(-90, 45, -260);
    sunDisc.lookAt(0, 0, 0);
    root.add(sunDisc);
    for (let i = 0; i < 9; i++) {
      const dune = new THREE.Mesh(new THREE.SphereGeometry(30 + Math.random() * 20, 16, 8), toon(0xe8b96a));
      dune.scale.y = 0.18;
      const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.9;
      dune.position.set(Math.cos(a) * 130, -2, Math.sin(a) * 110 - 30);
      root.add(dune);
    }
    const palmSpots = [[-30, -24], [30, -24], [-32, 6], [32, 6], [-30, 22], [30, 22], [-18, -30], [18, -30], [-40, -10], [40, -10], [-12, 26], [12, 26]];
    for (const [x, z] of palmSpots) root.add(palmTree(x, z, 0.9 + Math.random() * 0.4));
    const tents = [[-24, 24, 0xd84315], [-6, 25, 0x7b1fa2], [8, 26, 0x00897b], [24, 24, 0xffb300]];
    for (const [x, z, c] of tents) root.add(marketTent(x, z, c));
    root.fog = null;
  } else {
    const hemi = new THREE.HemisphereLight(0xfff0e0, 0x553355, 1.6);
    const key = new THREE.DirectionalLight(0xfff4e0, 1.7);
    key.position.set(10, 40, 20);
    lights.add(hemi, key);
    // Big top tent
    const stripes = canvasTex(256, 64, (c, w, h) => {
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff3e0' : '#d32f2f'; c.fillRect(i * w / 8, 0, w / 8 + 1, h); }
    });
    stripes.wrapS = THREE.RepeatWrapping;
    stripes.repeat.set(6, 1);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(52, 52, 16, 48, 1, true), new THREE.MeshLambertMaterial({ map: stripes, side: THREE.BackSide }));
    wall.position.y = 8;
    root.add(wall);
    const roofTex = stripes.clone(); roofTex.needsUpdate = true; roofTex.repeat.set(8, 1);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(52, 22, 48, 1, true), new THREE.MeshLambertMaterial({ map: roofTex, side: THREE.BackSide }));
    roof.position.y = 16 + 11;
    root.add(roof);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 38, 10), toon(0xffc94a));
    pole.position.set(0, 19, -40);
    root.add(pole);
    // String lights from the roof peak down to the tent wall
    const bulbs = [];
    const peak = new THREE.Vector3(0, 37, 0);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const end = new THREE.Vector3(Math.cos(a) * 50, 15, Math.sin(a) * 50);
      for (let i = 2; i < 22; i++) {
        const t = i / 22;
        const p = peak.clone().lerp(end, t);
        p.y -= Math.sin(t * Math.PI) * 2.5;
        bulbs.push(p);
      }
    }
    const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), bulbs.length);
    const bcols = [0xffe082, 0xff8a80, 0x80d8ff, 0xb9f6ca];
    const mm = new THREE.Matrix4();
    const cc = new THREE.Color();
    bulbs.forEach((p, i) => { mm.makeTranslation(p.x, p.y, p.z); bulbMesh.setMatrixAt(i, mm); bulbMesh.setColorAt(i, cc.setHex(bcols[i % 4])); });
    root.add(bulbMesh);
    // Sweeping spotlight beams
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beams = [];
    for (let i = 0; i < 4; i++) {
      const beam = new THREE.Mesh(new THREE.ConeGeometry(4, 30, 20, 1, true), beamMat);
      beam.geometry.translate(0, -15, 0);
      const holder = new THREE.Group();
      holder.position.set((i - 1.5) * 16, 30, -16);
      holder.add(beam);
      root.add(holder);
      beams.push(holder);
    }
    updaters.push((time) => {
      beams.forEach((b, i) => {
        b.rotation.z = Math.sin(time * 0.5 + i * 1.7) * 0.35;
        b.rotation.x = -0.3 + Math.cos(time * 0.4 + i) * 0.15;
      });
    });
    // Circus drums / pedestals around
    const drumCols = [0xd32f2f, 0x1e88e5, 0xffc94a, 0x43a047];
    const spotsD = [[-30, -20], [30, -20], [-30, 20], [30, 20], [-36, 0], [36, 0]];
    spotsD.forEach(([x, z], i) => {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.4, 18), toon(drumCols[i % 4]));
      d.position.set(x, 0.7, z);
      root.add(d);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.1, 6, 20), toon(0xffffff));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, 1.4, z);
      root.add(rim);
    });
    // Stars painted on the roof (seen through the opening above)
    const starGeo = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 300; i++) {
      const a = Math.random() * Math.PI * 2, r = 100 + Math.random() * 200;
      sp.push(Math.cos(a) * r, 80 + Math.random() * 150, Math.sin(a) * r);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    root.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 })));
  }

  return {
    group: root,
    crowd,
    update(time, dt) { for (const u of updaters) u(time, dt); },
  };
}
