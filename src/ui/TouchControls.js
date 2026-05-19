import Phaser from 'phaser';

/**
 * Touch-friendly on-canvas buttons. Mirrors the Container+setInteractive
 * pattern used by `makeButton` (which is already proven to work on iOS
 * Safari), just with a circular visual.
 *
 * @param {Phaser.Scene} scene
 * @param {object} opts
 * @param {number} opts.x       center x in game coords
 * @param {number} opts.y       center y in game coords
 * @param {number} [opts.radius=64]
 * @param {string} [opts.label='']
 * @param {number} [opts.color=0x3a1f5e]
 * @param {boolean} [opts.holdable=false] hold-style (Left/Right/Aim) vs tap (Jump/Shoot)
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
  const draw = (pressed) => {
    bg.clear();
    bg.fillStyle(color, pressed ? 0.85 : 0.55);
    bg.fillCircle(0, 0, radius);
    bg.lineStyle(4, 0xffffff, pressed ? 0.95 : 0.7);
    bg.strokeCircle(0, 0, radius);
  };
  draw(false);

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'Fredoka',
    fontSize: `${Math.round(radius * 0.6)}px`,
    fontStyle: '700',
    color: '#ffffff',
  }).setOrigin(0.5);

  container.add([bg, text]);
  container.setSize(radius * 2, radius * 2);
  container.setInteractive({ useHandCursor: true });

  const press = () => {
    state.isDown = true;
    draw(true);
    if (!holdable && onTap) onTap();
  };
  const release = () => {
    state.isDown = false;
    draw(false);
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
