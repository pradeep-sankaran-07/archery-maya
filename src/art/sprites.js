/**
 * Procedural sprite generator. Draws characters, enemies, items, bows etc
 * into Phaser Graphics textures so we don't need any external image files.
 */
import { PALETTE, CHARACTERS, BOWS, ARROW_COLORS } from '../config.js';

// helper: draw a soft-shadow rounded ellipse
function softCircle(g, x, y, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillCircle(x, y, r);
}

function roundRect(g, x, y, w, h, r, color) {
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, h, r);
}

function lineSeg(g, x1, y1, x2, y2, color, width = 2) {
  g.lineStyle(width, color, 1);
  g.lineBetween(x1, y1, x2, y2);
}

/**
 * Draw a cute human character to a Graphics object centered at (cx, cy).
 * size = approximate full height. Adults are taller, elders have white hair,
 * pet (dog) gets a special path.
 */
export function drawCharacter(g, cx, cy, character, opts = {}) {
  const { facing = 'right', size = 128, pose = 'idle' } = opts;
  if (character.isPet) {
    drawDog(g, cx, cy, character, size, facing, pose);
    return;
  }
  const s = size;
  const isAdult = character.isAdult;
  const headR = isAdult ? s * 0.16 : s * 0.18;
  const bodyW = isAdult ? s * 0.40 : s * 0.34;
  const bodyH = isAdult ? s * 0.40 : s * 0.34;
  const legH = isAdult ? s * 0.30 : s * 0.26;
  const armW = s * 0.10;
  const armH = isAdult ? s * 0.32 : s * 0.28;

  // overall offset so cy is feet
  const footY = cy + s * 0.5;
  const headCy = footY - legH - bodyH - headR * 0.4;
  const bodyTop = headCy + headR * 0.9;

  // shadow
  g.fillStyle(PALETTE.shadow, 0.25);
  g.fillEllipse(cx, footY + 4, bodyW * 1.4, 10);

  // legs
  const legColor = character.accent;
  const legY = footY - legH;
  roundRect(g, cx - bodyW * 0.32, legY, bodyW * 0.24, legH, 4, legColor);
  roundRect(g, cx + bodyW * 0.08, legY, bodyW * 0.24, legH, 4, legColor);

  // shoes
  g.fillStyle(PALETTE.black, 1);
  g.fillRoundedRect(cx - bodyW * 0.34, footY - 6, bodyW * 0.28, 8, 3);
  g.fillRoundedRect(cx + bodyW * 0.06, footY - 6, bodyW * 0.28, 8, 3);

  // body / shirt
  roundRect(g, cx - bodyW / 2, bodyTop, bodyW, bodyH, 6, character.body);
  // shirt detail stripe
  g.fillStyle(character.accent, 0.7);
  g.fillRect(cx - bodyW / 2, bodyTop + bodyH * 0.5, bodyW, 3);

  // arms (front arm slightly forward)
  const armColor = character.body;
  const armY = bodyTop + 2;
  const dir = facing === 'left' ? -1 : 1;
  // back arm
  roundRect(g, cx - bodyW * 0.5 - armW * 0.5, armY, armW, armH, 4, armColor);
  // front arm — shifted forward when shooting
  const frontShift = pose === 'shoot' ? dir * 8 : 0;
  roundRect(g, cx + bodyW * 0.4 - armW * 0.5 + frontShift, armY, armW, armH, 4, armColor);

  // skin tone hands
  const skin = lightenSkin(character.body);
  softCircle(g, cx - bodyW * 0.5, armY + armH, armW * 0.6, skin);
  softCircle(g, cx + bodyW * 0.4 + frontShift, armY + armH, armW * 0.6, skin);

  // head (skin)
  softCircle(g, cx, headCy, headR, skin);
  // hair (cap on top half only — leaves face visible)
  g.fillStyle(character.hair, 1);
  if (character.isElder) {
    // elders: thin sideburns + small tuft, leaving most of head bald/skin
    g.fillEllipse(cx - headR * 0.75, headCy + headR * 0.1, headR * 0.45, headR * 0.5);
    g.fillEllipse(cx + headR * 0.75, headCy + headR * 0.1, headR * 0.45, headR * 0.5);
    // small fringe
    g.fillRect(cx - headR * 0.6, headCy - headR * 0.92, headR * 1.2, headR * 0.18);
  } else {
    // hair as a top cap arc — start from a smaller circle offset upward,
    // then add a fringe rectangle just above eyes
    g.beginPath();
    g.arc(cx, headCy - headR * 0.05, headR * 1.0, Math.PI, 0, false);
    g.fillPath();
    // fringe / bangs sit just above the eye line (short)
    g.fillRect(cx - headR * 0.85, headCy - headR * 0.22, headR * 1.7, headR * 0.22);
    // small swoop on one side
    g.fillTriangle(cx + headR * 0.4, headCy - headR * 0.22, cx + headR * 0.85, headCy - headR * 0.22, cx + headR * 0.7, headCy + headR * 0.05);
  }

  // eyes
  const eyeY = headCy + headR * 0.05;
  const eyeOff = headR * 0.32;
  g.fillStyle(PALETTE.black, 1);
  g.fillCircle(cx - eyeOff, eyeY, headR * 0.10);
  g.fillCircle(cx + eyeOff, eyeY, headR * 0.10);
  // eye sparkle
  g.fillStyle(PALETTE.white, 1);
  g.fillCircle(cx - eyeOff + 1, eyeY - 1, headR * 0.04);
  g.fillCircle(cx + eyeOff + 1, eyeY - 1, headR * 0.04);

  // smile
  g.lineStyle(2, PALETTE.black, 1);
  g.beginPath();
  g.arc(cx, headCy + headR * 0.3, headR * 0.28, 0.2, Math.PI - 0.2, false);
  g.strokePath();

  // cheeks
  g.fillStyle(PALETTE.pink, 0.45);
  g.fillCircle(cx - eyeOff - 2, eyeY + headR * 0.25, headR * 0.10);
  g.fillCircle(cx + eyeOff + 2, eyeY + headR * 0.25, headR * 0.10);

  // glasses for some elders (Thatha + Lolo)
  if (character.isElder && (character.id === 'thatha' || character.id === 'lolo')) {
    g.lineStyle(2, PALETTE.black, 1);
    g.strokeCircle(cx - eyeOff, eyeY, headR * 0.22);
    g.strokeCircle(cx + eyeOff, eyeY, headR * 0.22);
    g.lineBetween(cx - eyeOff + headR * 0.22, eyeY, cx + eyeOff - headR * 0.22, eyeY);
  }

  // headbands or small accessories — bun for paati/lola
  if (character.id === 'paati' || character.id === 'lola') {
    g.fillStyle(character.hair, 1);
    g.fillCircle(cx, headCy - headR * 1.1, headR * 0.35);
  }
}

function drawDog(g, cx, cy, character, size, facing, pose) {
  // The dog's footY is tied to the same ground-line that drawCharacter uses
  // for humans (cy + size*0.5), so Benji's feet land on the platform top
  // just like every other character.
  const footY = cy + size * 0.5;
  // s controls horizontal/body proportions; keep it small enough that the
  // dog (snout + tail) fits inside a 96-wide sprite frame.
  const s = size * 0.62;
  const dir = facing === 'left' ? -1 : 1;
  // shadow
  g.fillStyle(PALETTE.shadow, 0.25);
  g.fillEllipse(cx, footY + 2, s * 0.7, 6);
  // body (oval)
  g.fillStyle(character.body, 1);
  g.fillEllipse(cx - dir * s * 0.05, footY - s * 0.20, s * 0.62, s * 0.30);
  // head — pulled in close so the snout stays inside the frame
  const headCx = cx + dir * s * 0.25;
  const headCy = footY - s * 0.34;
  g.fillCircle(headCx, headCy, s * 0.16);
  // floppy ear (back side)
  g.fillStyle(character.accent, 1);
  g.fillEllipse(headCx - dir * s * 0.07, headCy - s * 0.05, s * 0.09, s * 0.16);
  // snout
  g.fillStyle(character.accent, 1);
  g.fillEllipse(headCx + dir * s * 0.10, headCy + s * 0.05, s * 0.11, s * 0.08);
  // eye
  g.fillStyle(PALETTE.white, 1);
  g.fillCircle(headCx + dir * s * 0.04, headCy - s * 0.04, s * 0.032);
  g.fillStyle(PALETTE.black, 1);
  g.fillCircle(headCx + dir * s * 0.05, headCy - s * 0.04, s * 0.018);
  // nose tip
  g.fillStyle(PALETTE.black, 1);
  g.fillCircle(headCx + dir * s * 0.15, headCy + s * 0.04, s * 0.026);
  // mouth (small smile line)
  g.lineStyle(1.5, PALETTE.black, 1);
  g.lineBetween(headCx + dir * s * 0.08, headCy + s * 0.10, headCx + dir * s * 0.15, headCy + s * 0.09);
  // legs — short, ending right at footY so they sit on the ground
  g.fillStyle(character.body, 1);
  for (let i = 0; i < 4; i++) {
    const lx = cx - s * 0.22 + i * s * 0.14;
    g.fillRect(lx - 3, footY - s * 0.14, 6, s * 0.14);
  }
  // tail (small curl, well inside the frame)
  g.fillStyle(character.body, 1);
  g.fillTriangle(
    cx - dir * s * 0.30, footY - s * 0.28,
    cx - dir * s * 0.40, footY - s * 0.42,
    cx - dir * s * 0.30, footY - 0.18 * s,
  );
}

function lightenSkin(bodyColor) {
  // Don't actually use body color — pick a friendly mid skin tone independent of clothing
  return 0xf5c89a;
}

/**
 * Draw a bow held at given pivot point with given draw angle (rad).
 */
export function drawBow(g, x, y, bow, angle = 0, scale = 1) {
  g.save && g.save();
  const r = 28 * scale;
  // Bow limbs (two arcs forming a recurve)
  g.lineStyle(5, bow.color, 1);
  if (bow.id === 'heart') {
    // heart-shape bow grip
    const cx = x, cy = y;
    g.fillStyle(bow.color, 1);
    const hx = Math.cos(angle), hy = Math.sin(angle);
    // draw two lobes
    const px = cx - hy * 14, py = cy + hx * 14;
    const nx = cx + hy * 14, ny = cy - hx * 14;
    g.fillCircle(px, py, 8);
    g.fillCircle(nx, ny, 8);
    g.fillTriangle(
      cx - hy * 22, cy + hx * 22,
      cx + hy * 22, cy - hx * 22,
      cx + hx * 26, cy + hy * 26,
    );
  } else {
    // arc
    g.beginPath();
    g.arc(x, y, r, angle - Math.PI * 0.45, angle + Math.PI * 0.45, false);
    g.strokePath();
  }
  // string
  g.lineStyle(1, PALETTE.white, 0.8);
  g.beginPath();
  const sx1 = x + Math.cos(angle - Math.PI * 0.45) * r;
  const sy1 = y + Math.sin(angle - Math.PI * 0.45) * r;
  const sx2 = x + Math.cos(angle + Math.PI * 0.45) * r;
  const sy2 = y + Math.sin(angle + Math.PI * 0.45) * r;
  g.moveTo(sx1, sy1);
  g.lineTo(sx2, sy2);
  g.strokePath();
  // Sparkle decoration for sparkle bow
  if (bow.id === 'sparkle') {
    g.fillStyle(PALETTE.white, 1);
    g.fillCircle(x + Math.cos(angle - Math.PI * 0.45) * r, y + Math.sin(angle - Math.PI * 0.45) * r, 3);
    g.fillCircle(x + Math.cos(angle + Math.PI * 0.45) * r, y + Math.sin(angle + Math.PI * 0.45) * r, 3);
  }
}

/**
 * Draw an arrow flying along its body axis. (x, y) is the tip.
 */
export function drawArrow(g, tipX, tipY, angle, arrowColor, len = 40) {
  const tailX = tipX - Math.cos(angle) * len;
  const tailY = tipY - Math.sin(angle) * len;
  // shaft
  if (arrowColor.rainbow) {
    const segs = [0xff5a5f, 0xffa94a, 0xffc94a, 0x4caf50, 0x4a90e2, 0x8b5fbf];
    for (let i = 0; i < segs.length; i++) {
      const t1 = i / segs.length, t2 = (i + 1) / segs.length;
      const x1 = tailX + (tipX - tailX) * t1, y1 = tailY + (tipY - tailY) * t1;
      const x2 = tailX + (tipX - tailX) * t2, y2 = tailY + (tipY - tailY) * t2;
      g.lineStyle(4, segs[i], 1);
      g.lineBetween(x1, y1, x2, y2);
    }
  } else {
    g.lineStyle(4, arrowColor.color, 1);
    g.lineBetween(tailX, tailY, tipX, tipY);
  }
  // head
  g.fillStyle(0xb0b0b0, 1);
  const hx = tipX, hy = tipY;
  const px = Math.cos(angle + Math.PI * 0.85) * 8 + hx;
  const py = Math.sin(angle + Math.PI * 0.85) * 8 + hy;
  const qx = Math.cos(angle - Math.PI * 0.85) * 8 + hx;
  const qy = Math.sin(angle - Math.PI * 0.85) * 8 + hy;
  g.fillTriangle(hx, hy, px, py, qx, qy);
  // fletching
  g.fillStyle(PALETTE.white, 1);
  const fx = tailX, fy = tailY;
  const ax = fx + Math.cos(angle + Math.PI * 0.5) * 6;
  const ay = fy + Math.sin(angle + Math.PI * 0.5) * 6;
  const bx = fx + Math.cos(angle - Math.PI * 0.5) * 6;
  const by = fy + Math.sin(angle - Math.PI * 0.5) * 6;
  const tx = fx + Math.cos(angle + Math.PI) * 6;
  const ty = fy + Math.sin(angle + Math.PI) * 6;
  g.fillTriangle(fx, fy, ax, ay, tx, ty);
  g.fillTriangle(fx, fy, bx, by, tx, ty);
}

/**
 * Bullseye target. Draws concentric rings.
 */
export function drawTarget(g, cx, cy, radius) {
  // stand pole
  g.fillStyle(PALETTE.dirtDark, 1);
  g.fillRect(cx - 4, cy, 8, radius * 2);
  // rings
  const rings = [
    { r: radius, c: 0xffffff },
    { r: radius * 0.82, c: 0x14131a },
    { r: radius * 0.66, c: 0x4a90e2 },
    { r: radius * 0.50, c: 0xff5a5f },
    { r: radius * 0.34, c: 0xffc94a },
    { r: radius * 0.18, c: 0xff5a5f },
  ];
  rings.forEach((r) => {
    g.fillStyle(r.c, 1);
    g.fillCircle(cx, cy, r.r);
  });
  // outer border
  g.lineStyle(2, PALETTE.black, 1);
  g.strokeCircle(cx, cy, radius);
}

export function drawCoin(g, cx, cy, r = 16) {
  g.fillStyle(0xffe066, 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(0xc7951c, 1);
  g.fillCircle(cx, cy, r * 0.7);
  g.fillStyle(0xffe066, 1);
  g.fillCircle(cx, cy, r * 0.4);
  g.lineStyle(2, 0xc7951c, 1);
  g.strokeCircle(cx, cy, r);
}

// Enemies — drawn into a Graphics that gets converted to texture by caller.
export function drawSnake(g, cx, cy) {
  // body wave
  g.fillStyle(0x2a8c4a, 1);
  for (let i = 0; i < 8; i++) {
    g.fillCircle(cx - 32 + i * 8, cy + Math.sin(i * 0.9) * 4, 8);
  }
  // head
  g.fillStyle(0x1f6638, 1);
  g.fillCircle(cx + 36, cy, 11);
  g.fillStyle(0xff5a5f, 1);
  g.fillTriangle(cx + 46, cy, cx + 56, cy - 3, cx + 56, cy + 3);
  // eye
  g.fillStyle(PALETTE.white, 1);
  g.fillCircle(cx + 38, cy - 4, 3);
  g.fillStyle(PALETTE.black, 1);
  g.fillCircle(cx + 39, cy - 4, 1.5);
}

export function drawTiger(g, cx, cy) {
  // shadow
  g.fillStyle(PALETTE.shadow, 0.3);
  g.fillEllipse(cx, cy + 32, 70, 8);
  // body
  g.fillStyle(0xff9a3c, 1);
  g.fillEllipse(cx, cy + 8, 80, 36);
  // stripes
  g.fillStyle(PALETTE.black, 1);
  for (let i = 0; i < 5; i++) g.fillRect(cx - 30 + i * 14, cy - 2, 4, 18);
  // head
  g.fillStyle(0xff9a3c, 1);
  g.fillCircle(cx + 36, cy - 4, 22);
  // ears
  g.fillTriangle(cx + 22, cy - 22, cx + 30, cy - 16, cx + 20, cy - 12);
  g.fillTriangle(cx + 50, cy - 22, cx + 42, cy - 16, cx + 52, cy - 12);
  // face stripes
  g.fillStyle(PALETTE.black, 1);
  g.fillRect(cx + 26, cy - 16, 3, 8);
  g.fillRect(cx + 44, cy - 16, 3, 8);
  // eyes
  g.fillStyle(0xffe066, 1);
  g.fillCircle(cx + 30, cy - 6, 4);
  g.fillCircle(cx + 44, cy - 6, 4);
  g.fillStyle(PALETTE.black, 1);
  g.fillCircle(cx + 30, cy - 6, 2);
  g.fillCircle(cx + 44, cy - 6, 2);
  // nose / mouth
  g.fillStyle(PALETTE.pink, 1);
  g.fillTriangle(cx + 36, cy + 2, cx + 33, cy - 1, cx + 39, cy - 1);
  g.lineStyle(2, PALETTE.black, 1);
  g.lineBetween(cx + 36, cy + 3, cx + 36, cy + 8);
  // legs
  g.fillStyle(0xff9a3c, 1);
  for (let i = 0; i < 4; i++) g.fillRect(cx - 30 + i * 16, cy + 18, 8, 14);
  // tail
  g.lineStyle(6, 0xff9a3c, 1);
  g.beginPath();
  g.moveTo(cx - 40, cy);
  g.lineTo(cx - 56, cy - 8);
  g.lineTo(cx - 60, cy - 22);
  g.strokePath();
}

export function drawShark(g, cx, cy) {
  // body
  g.fillStyle(0x5a7a99, 1);
  g.fillEllipse(cx, cy, 90, 30);
  // belly
  g.fillStyle(0xcfdce8, 1);
  g.fillEllipse(cx, cy + 6, 70, 14);
  // dorsal fin
  g.fillStyle(0x445e75, 1);
  g.fillTriangle(cx - 4, cy - 15, cx + 14, cy - 32, cx + 18, cy - 15);
  // tail
  g.fillTriangle(cx - 44, cy, cx - 64, cy - 18, cx - 60, cy + 14);
  // mouth
  g.fillStyle(PALETTE.white, 1);
  g.fillTriangle(cx + 36, cy + 4, cx + 46, cy + 8, cx + 38, cy + 10);
  // teeth
  g.fillStyle(PALETTE.white, 1);
  for (let i = 0; i < 4; i++) g.fillTriangle(cx + 36 + i * 3, cy + 6, cx + 38 + i * 3, cy + 6, cx + 37 + i * 3, cy + 9);
  // eye
  g.fillStyle(PALETTE.white, 1);
  g.fillCircle(cx + 26, cy - 6, 4);
  g.fillStyle(PALETTE.black, 1);
  g.fillCircle(cx + 27, cy - 6, 2);
}

export function drawJellyfish(g, cx, cy) {
  // dome
  g.fillStyle(0xff7eb3, 0.85);
  g.fillCircle(cx, cy, 24);
  g.fillStyle(0xff7eb3, 0.85);
  g.fillRect(cx - 24, cy, 48, 8);
  // dome highlight
  g.fillStyle(0xffffff, 0.4);
  g.fillEllipse(cx - 6, cy - 10, 16, 8);
  // tentacles
  g.lineStyle(3, 0xff7eb3, 0.85);
  for (let i = -3; i <= 3; i++) {
    const x = cx + i * 6;
    g.beginPath();
    g.moveTo(x, cy + 8);
    g.lineTo(x + Math.sin(i) * 4, cy + 22);
    g.lineTo(x - Math.sin(i) * 4, cy + 36);
    g.strokePath();
  }
}

/**
 * Kupal — a friendly cartoon dinosaur boss. Drawn facing right.
 */
export function drawKupal(g, cx, cy) {
  // shadow
  g.fillStyle(PALETTE.shadow, 0.3);
  g.fillEllipse(cx, cy + 56, 110, 12);
  // tail (curved, behind body)
  g.fillStyle(0x4caf50, 1);
  g.fillTriangle(cx - 60, cy + 10, cx - 96, cy - 18, cx - 58, cy + 36);
  // body — big round
  g.fillStyle(0x4caf50, 1);
  g.fillEllipse(cx, cy + 18, 140, 80);
  // belly (lighter)
  g.fillStyle(0xc8e6c9, 1);
  g.fillEllipse(cx + 8, cy + 30, 90, 40);
  // back spots (darker)
  g.fillStyle(0x2e7d32, 1);
  g.fillCircle(cx - 30, cy + 4, 6);
  g.fillCircle(cx - 10, cy - 6, 7);
  g.fillCircle(cx + 14, cy + 2, 6);
  g.fillCircle(cx + 36, cy - 4, 7);
  // legs
  g.fillStyle(0x2e7d32, 1);
  g.fillRoundedRect(cx - 36, cy + 46, 18, 22, 6);
  g.fillRoundedRect(cx + 20, cy + 46, 18, 22, 6);
  // head
  g.fillStyle(0x4caf50, 1);
  g.fillCircle(cx + 60, cy - 10, 36);
  // snout
  g.fillStyle(0x4caf50, 1);
  g.fillEllipse(cx + 88, cy + 4, 36, 22);
  // belly under snout
  g.fillStyle(0xc8e6c9, 1);
  g.fillEllipse(cx + 90, cy + 10, 24, 12);
  // nostril
  g.fillStyle(0x14131a, 1);
  g.fillCircle(cx + 98, cy - 2, 2);
  // eye
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 70, cy - 18, 8);
  g.fillStyle(0x14131a, 1);
  g.fillCircle(cx + 72, cy - 18, 4);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 73, cy - 19, 1.5);
  // back spikes (3 small triangles along the spine)
  g.fillStyle(0x2e7d32, 1);
  for (let i = 0; i < 4; i++) {
    const sx = cx - 36 + i * 24;
    g.fillTriangle(sx - 6, cy - 18, sx + 6, cy - 18, sx, cy - 32);
  }
  // smile
  g.lineStyle(2, 0x14131a, 1);
  g.beginPath();
  g.arc(cx + 82, cy + 6, 8, 0.1, Math.PI - 0.1, false);
  g.strokePath();
}

export function drawFish(g, cx, cy) {
  const c = 0xffc94a;
  g.fillStyle(c, 1);
  g.fillEllipse(cx, cy, 36, 20);
  g.fillTriangle(cx - 18, cy, cx - 32, cy - 10, cx - 32, cy + 10);
  // eye
  g.fillStyle(PALETTE.white, 1);
  g.fillCircle(cx + 10, cy - 3, 3);
  g.fillStyle(PALETTE.black, 1);
  g.fillCircle(cx + 11, cy - 3, 1.5);
  // stripes
  g.fillStyle(0xff9a3c, 1);
  g.fillRect(cx - 6, cy - 10, 3, 20);
  g.fillRect(cx + 2, cy - 10, 3, 20);
}

export function drawHeart(g, cx, cy, r = 12, color = 0xff5a5f) {
  g.fillStyle(color, 1);
  g.fillCircle(cx - r * 0.5, cy - r * 0.3, r * 0.6);
  g.fillCircle(cx + r * 0.5, cy - r * 0.3, r * 0.6);
  g.fillTriangle(cx - r * 0.95, cy, cx + r * 0.95, cy, cx, cy + r * 0.95);
}

/**
 * Pre-generate all texture atlases (rect frames) used by the game.
 * Called once in the PreloadScene.
 */
export function generateAllTextures(scene) {
  // Player textures: one idle + one shoot per character, facing right.
  CHARACTERS.forEach((c) => {
    const w = 96, h = 144;
    ['idle', 'walk', 'shoot', 'jump'].forEach((pose) => {
      const key = `char_${c.id}_${pose}`;
      if (scene.textures.exists(key)) return;
      const g = scene.add.graphics({ x: 0, y: 0 });
      drawCharacter(g, w / 2, h / 2, c, { facing: 'right', size: h * 0.9, pose });
      g.generateTexture(key, w, h);
      g.destroy();
    });
  });

  // Portrait (square, larger head ratio)
  CHARACTERS.forEach((c) => {
    const w = 160, h = 160;
    const key = `portrait_${c.id}`;
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics({ x: 0, y: 0 });
    // background tile
    g.fillStyle(PALETTE.cream, 1);
    g.fillRoundedRect(4, 4, w - 8, h - 8, 14);
    g.lineStyle(3, PALETTE.shadow, 0.3);
    g.strokeRoundedRect(4, 4, w - 8, h - 8, 14);
    // Pets centre nicely without the human-character downward offset
    // (humans need feet near the bottom of the card; pets are smaller and
    // sit more naturally with a centred placement).
    const cyOffset = c.isPet ? -10 : 30;
    const portraitSize = c.isPet ? h * 1.05 : h * 0.9;
    drawCharacter(g, w / 2, h / 2 + cyOffset, c, { size: portraitSize });
    g.generateTexture(key, w, h);
    g.destroy();
  });

  // Target
  {
    const w = 140, h = 220;
    if (!scene.textures.exists('target')) {
      const g = scene.add.graphics({ x: 0, y: 0 });
      drawTarget(g, w / 2, 60, 56);
      g.generateTexture('target', w, h);
      g.destroy();
    }
  }

  // Coin
  if (!scene.textures.exists('coin')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawCoin(g, 16, 16, 14);
    g.generateTexture('coin', 32, 32);
    g.destroy();
  }

  // Heart
  if (!scene.textures.exists('heart')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawHeart(g, 16, 16, 14, 0xff5a5f);
    g.generateTexture('heart', 32, 32);
    g.destroy();
  }
  if (!scene.textures.exists('heart_empty')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawHeart(g, 16, 16, 14, 0x6a3030);
    g.generateTexture('heart_empty', 32, 32);
    g.destroy();
  }

  // Enemies
  if (!scene.textures.exists('snake')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawSnake(g, 60, 16);
    g.generateTexture('snake', 120, 32);
    g.destroy();
  }
  if (!scene.textures.exists('tiger')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawTiger(g, 60, 24);
    g.generateTexture('tiger', 120, 64);
    g.destroy();
  }
  if (!scene.textures.exists('shark')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawShark(g, 80, 32);
    g.generateTexture('shark', 160, 64);
    g.destroy();
  }
  if (!scene.textures.exists('jellyfish')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawJellyfish(g, 32, 28);
    g.generateTexture('jellyfish', 64, 72);
    g.destroy();
  }
  if (!scene.textures.exists('fish')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawFish(g, 24, 16);
    g.generateTexture('fish', 48, 32);
    g.destroy();
  }
  if (!scene.textures.exists('kupal')) {
    const w = 220, h = 160;
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawKupal(g, w / 2, h / 2);
    g.generateTexture('kupal', w, h);
    g.destroy();
  }
  if (!scene.textures.exists('fireball')) {
    const w = 36, h = 36;
    const g = scene.add.graphics({ x: 0, y: 0 });
    // Outer flame (orange)
    g.fillStyle(0xff8a3c, 1); g.fillCircle(w / 2, h / 2, 16);
    // Mid (yellow)
    g.fillStyle(0xffc94a, 1); g.fillCircle(w / 2, h / 2, 11);
    // Hot core (white)
    g.fillStyle(0xfff7e6, 1); g.fillCircle(w / 2 - 1, h / 2 - 1, 5);
    // little tongues of flame on the leading edge
    g.fillStyle(0xff5a5f, 1);
    g.fillTriangle(w / 2 + 14, h / 2 - 6, w / 2 + 20, h / 2, w / 2 + 14, h / 2 + 6);
    g.generateTexture('fireball', w, h);
    g.destroy();
  }

  // Pipe (Mario-style green)
  if (!scene.textures.exists('pipe')) {
    const w = 90, h = 120;
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2e7d32, 1); g.fillRect(8, 24, 74, h - 24);
    g.fillStyle(0x4caf50, 1); g.fillRect(14, 30, 62, h - 30);
    g.fillStyle(0x2e7d32, 1); g.fillRect(0, 0, w, 28);
    g.fillStyle(0x4caf50, 1); g.fillRect(6, 6, w - 12, 18);
    g.fillStyle(0xffffff, 0.18); g.fillRect(20, 38, 8, h - 50);
    g.generateTexture('pipe', w, h);
    g.destroy();
  }

  // Flag pole + flag
  if (!scene.textures.exists('flagpole')) {
    const w = 16, h = 280;
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0xeeeeee, 1); g.fillRect(6, 0, 4, h);
    g.fillStyle(0xffc94a, 1); g.fillCircle(8, 6, 6);
    g.generateTexture('flagpole', w, h);
    g.destroy();
  }
  if (!scene.textures.exists('flag')) {
    const w = 60, h = 36;
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(PALETTE.red, 1); g.fillTriangle(0, 0, w, h / 2, 0, h);
    g.fillStyle(PALETTE.gold, 1); g.fillCircle(14, h / 2, 6);
    g.generateTexture('flag', w, h);
    g.destroy();
  }

  // Tile blocks (grass top, dirt, underwater rock)
  if (!scene.textures.exists('tile_grass')) {
    const w = 64, h = 64, g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(PALETTE.dirt, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(PALETTE.dirtDark, 1);
    for (let i = 0; i < 10; i++) g.fillRect((i * 17) % w, 18 + (i * 7) % 40, 6, 6);
    g.fillStyle(PALETTE.grass, 1); g.fillRect(0, 0, w, 14);
    g.fillStyle(PALETTE.grassDark, 1);
    for (let i = 0; i < 8; i++) g.fillRect(i * 8, 12, 6, 4);
    g.generateTexture('tile_grass', w, h);
    g.destroy();
  }
  if (!scene.textures.exists('tile_dirt')) {
    const w = 64, h = 64, g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(PALETTE.dirt, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(PALETTE.dirtDark, 1);
    for (let i = 0; i < 14; i++) g.fillRect((i * 19) % w, (i * 11) % h, 6, 6);
    g.generateTexture('tile_dirt', w, h);
    g.destroy();
  }
  if (!scene.textures.exists('tile_rock')) {
    const w = 64, h = 64, g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2c4a6e, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(0x1d3654, 1);
    for (let i = 0; i < 14; i++) g.fillCircle((i * 13) % w, (i * 17) % h, 4);
    g.generateTexture('tile_rock', w, h);
    g.destroy();
  }

  // Bow textures (centered, multiple variations)
  BOWS.forEach((bow) => {
    ARROW_COLORS.forEach((arrow) => {
      const key = `bow_${bow.id}_${arrow.id}`;
      if (scene.textures.exists(key)) return;
      const w = 80, h = 80;
      const g = scene.add.graphics({ x: 0, y: 0 });
      drawBow(g, w / 2, h / 2, bow, 0);
      g.generateTexture(key, w, h);
      g.destroy();
    });
  });

  // Arrow texture (horizontal pointing right)
  ARROW_COLORS.forEach((arrow) => {
    const key = `arrow_${arrow.id}`;
    if (scene.textures.exists(key)) return;
    const w = 60, h = 16;
    const g = scene.add.graphics({ x: 0, y: 0 });
    drawArrow(g, w - 4, h / 2, 0, arrow, 50);
    g.generateTexture(key, w, h);
    g.destroy();
  });

  // House
  if (!scene.textures.exists('house')) {
    const w = 240, h = 220;
    const g = scene.add.graphics({ x: 0, y: 0 });
    // body
    g.fillStyle(0xfff1d6, 1); g.fillRect(20, 80, w - 40, h - 100);
    // roof
    g.fillStyle(0xc04848, 1); g.fillTriangle(0, 90, w, 90, w / 2, 0);
    // door
    g.fillStyle(0x8b5a2b, 1); g.fillRect(w / 2 - 24, h - 80, 48, 60);
    g.fillStyle(0xffc94a, 1); g.fillCircle(w / 2 + 14, h - 50, 3);
    // window
    g.fillStyle(0x9bdcf2, 1); g.fillRect(50, 110, 36, 36); g.fillRect(w - 86, 110, 36, 36);
    g.lineStyle(2, 0xffffff, 1);
    g.lineBetween(68, 110, 68, 146); g.lineBetween(50, 128, 86, 128);
    g.lineBetween(w - 68, 110, w - 68, 146); g.lineBetween(w - 86, 128, w - 50, 128);
    g.generateTexture('house', w, h);
    g.destroy();
  }

  // Cloud
  if (!scene.textures.exists('cloud')) {
    const w = 160, h = 64;
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(PALETTE.white, 0.9);
    g.fillCircle(40, 38, 24); g.fillCircle(76, 30, 28); g.fillCircle(116, 36, 22);
    g.fillRoundedRect(20, 36, 124, 20, 10);
    g.generateTexture('cloud', w, h);
    g.destroy();
  }

  // Grocery shelf
  if (!scene.textures.exists('shelf')) {
    const w = 800, h = 360;
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0x6b3f25, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(0x8b5a2b, 1);
    for (let i = 0; i < 3; i++) g.fillRect(0, 10 + i * 120, w, 12);
    g.fillRect(0, h - 10, w, 10);
    g.generateTexture('shelf', w, h);
    g.destroy();
  }

  // Bubble (underwater decoration)
  if (!scene.textures.exists('bubble')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.lineStyle(2, 0xffffff, 0.8); g.strokeCircle(10, 10, 7);
    g.fillStyle(0xffffff, 0.4); g.fillCircle(8, 7, 2);
    g.generateTexture('bubble', 20, 20);
    g.destroy();
  }

  // Particle pixel (for confetti & coin pops)
  if (!scene.textures.exists('particle_white')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4);
    g.generateTexture('particle_white', 8, 8);
    g.destroy();
  }
  if (!scene.textures.exists('particle_gold')) {
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffe066, 1); g.fillCircle(4, 4, 4);
    g.generateTexture('particle_gold', 8, 8);
    g.destroy();
  }
}
