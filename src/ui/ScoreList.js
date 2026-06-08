import Phaser from 'phaser';
import { t } from '../i18n/index.js';

// A masked, scrollable leaderboard list. Works on desktop (mouse wheel) and
// touch (drag). Returns { container, destroy }.
//
// opts: { x, y, w, h, entries, highlightName }
export function createScoreList(scene, opts) {
  const { x, y, w, h, entries = [], highlightName = null } = opts;

  const ROW_H = 40;
  const objects = [];

  // Empty state
  if (!entries.length) {
    const empty = scene.add.text(x + w / 2, y + h / 2, t('leaderboard.noScores'), {
      fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '600',
      color: '#3a1f5e', align: 'center',
    }).setOrigin(0.5);
    return {
      container: empty,
      destroy() { empty.destroy(); },
    };
  }

  // Scrollable content container
  const container = scene.add.container(x, y);

  entries.forEach((e, i) => {
    const ry = i * ROW_H;
    const isTop = i === 0;
    const isMe = highlightName && e.name === highlightName;

    // Row background for the highlighted (just-submitted) player
    if (isMe) {
      const rowBg = scene.add.graphics();
      rowBg.fillStyle(0xfff1c5, 1);
      rowBg.fillRoundedRect(4, ry - 2, w - 8, ROW_H - 4, 8);
      container.add(rowBg);
    }

    const rankColor = isTop ? '#c4951c' : '#3a1f5e';
    const rank = scene.add.text(20, ry, `${i + 1}.`, {
      fontFamily: 'Fredoka', fontSize: '20px', fontStyle: '700', color: rankColor,
    });
    const name = scene.add.text(72, ry, e.name, {
      fontFamily: 'Fredoka', fontSize: '20px', fontStyle: '600', color: '#3a1f5e',
    });
    const score = scene.add.text(w - 250, ry, `${e.score} kr`, {
      fontFamily: 'Fredoka', fontSize: '20px', fontStyle: '700', color: '#3a1f5e',
    });
    const date = scene.add.text(w - 120, ry, formatDate(e.date), {
      fontFamily: 'Fredoka', fontSize: '16px', color: '#6a5288',
    });
    container.add([rank, name, score, date]);
  });

  // Geometry mask so rows are clipped to the [x, y, w, h] window.
  const maskShape = scene.make.graphics();
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(x, y, w, h);
  const mask = maskShape.createGeometryMask();
  container.setMask(mask);
  objects.push(maskShape);

  // Scroll bounds
  const contentH = entries.length * ROW_H;
  const minY = Math.min(0, h - contentH); // most-negative offset
  let scrollY = 0;
  const setScroll = (v) => {
    scrollY = Phaser.Math.Clamp(v, minY, 0);
    container.y = y + scrollY;
    drawScrollbar();
  };

  // Thin scrollbar indicator on the right edge (only if content overflows)
  const scrollbar = scene.add.graphics();
  const drawScrollbar = () => {
    scrollbar.clear();
    if (contentH <= h) return;
    const trackX = x + w - 6;
    const thumbH = Math.max(30, (h / contentH) * h);
    const range = h - thumbH;
    const frac = minY === 0 ? 0 : scrollY / minY; // 0..1
    const thumbY = y + frac * range;
    scrollbar.fillStyle(0x3a1f5e, 0.25);
    scrollbar.fillRoundedRect(trackX, y, 4, h, 2);
    scrollbar.fillStyle(0x3a1f5e, 0.7);
    scrollbar.fillRoundedRect(trackX, thumbY, 4, thumbH, 2);
  };
  drawScrollbar();

  // ── Input: wheel (desktop) + drag (touch/mouse) ───────────────────────
  const inRect = (px, py) => px >= x && px <= x + w && py >= y && py <= y + h;

  const onWheel = (_pointer, _over, _dx, dy) => {
    const p = scene.input.activePointer;
    if (!inRect(p.x, p.y)) return;
    setScroll(scrollY - dy * 0.5);
  };
  scene.input.on('wheel', onWheel);

  let dragging = false;
  let dragStartPointerY = 0;
  let dragStartScrollY = 0;

  const onDown = (pointer) => {
    if (!inRect(pointer.x, pointer.y)) return;
    dragging = true;
    dragStartPointerY = pointer.y;
    dragStartScrollY = scrollY;
  };
  const onMove = (pointer) => {
    if (!dragging) return;
    setScroll(dragStartScrollY + (pointer.y - dragStartPointerY));
  };
  const onUp = () => { dragging = false; };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  scene.input.on('pointerupoutside', onUp);

  return {
    container,
    destroy() {
      scene.input.off('wheel', onWheel);
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointermove', onMove);
      scene.input.off('pointerup', onUp);
      scene.input.off('pointerupoutside', onUp);
      container.destroy();
      scrollbar.destroy();
      objects.forEach((o) => o.destroy());
    },
  };
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}
