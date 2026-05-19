import Phaser from 'phaser';

/**
 * Touch-friendly on-canvas buttons. Used by gameplay scenes on phones /
 * tablets. Buttons live inside the Phaser canvas so they auto-scale and
 * stay positioned correctly under Scale.FIT + CENTER_BOTH.
 *
 * Two flavours via the `holdable` flag:
 *   - holdable: returns { isDown, destroy }; press-and-hold lights up
 *     while the player keeps a finger down.
 *   - tap (default): returns { destroy }; fires `onTap` on each press.
 */

/**
 * @param {Phaser.Scene} scene
 * @param {object} opts
 * @param {number} opts.x  - center x
 * @param {number} opts.y  - center y
 * @param {number} [opts.radius=64]
 * @param {string} [opts.label='']
 * @param {number} [opts.color=0x3a1f5e]
 * @param {boolean} [opts.holdable=false]
 * @param {() => void} [opts.onTap]
 */
export function makeTouchButton(scene, opts) {
  const {
    x, y,
    radius = 64,
    label = '',
    color = 0x3a1f5e,
    holdable = false,
    onTap,
  } = opts;

  const state = { isDown: false };
  const container = scene.add.container(x, y).setScrollFactor(0).setDepth(2000);

  const bg = scene.add.graphics();
  const drawBg = (pressed) => {
    bg.clear();
    bg.fillStyle(color, pressed ? 0.85 : 0.55);
    bg.fillCircle(0, 0, radius);
    bg.lineStyle(4, 0xffffff, pressed ? 0.95 : 0.7);
    bg.strokeCircle(0, 0, radius);
  };
  drawBg(false);
  container.add(bg);

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'Fredoka',
    fontSize: `${Math.round(radius * 0.6)}px`,
    fontStyle: '700',
    color: '#ffffff',
  }).setOrigin(0.5);
  container.add(text);

  // Interactive zone — a circle hit area sized to the button.
  container.setSize(radius * 2, radius * 2);
  container.setInteractive(
    new Phaser.Geom.Circle(0, 0, radius),
    Phaser.Geom.Circle.Contains,
  );

  const press = () => {
    state.isDown = true;
    drawBg(true);
    if (!holdable && onTap) onTap();
  };
  const release = () => {
    state.isDown = false;
    drawBg(false);
  };

  container.on('pointerdown', press);
  container.on('pointerup', release);
  container.on('pointerout', release);
  container.on('pointerupoutside', release);
  container.on('pointercancel', release);

  return {
    isDown: () => state.isDown,
    container,
    destroy() { container.destroy(); },
  };
}
