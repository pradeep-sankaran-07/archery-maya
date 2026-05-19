import Phaser from 'phaser';

/**
 * Touch-friendly on-canvas buttons. Used by gameplay scenes on phones /
 * tablets. Buttons live inside the Phaser canvas so they auto-scale and
 * stay positioned correctly under Scale.FIT + CENTER_BOTH.
 *
 * Implementation note: we use a Phaser.GameObjects.Arc as the hit target
 * (which has built-in circular hit detection that works reliably across
 * desktop pointer events and iOS / Android touch events). The label text
 * sits on top of it as a separate, non-interactive game object.
 */

/**
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

  // The Arc IS the interactive surface and gives us reliable circular
  // hit detection on every platform.
  const bg = scene.add.circle(x, y, radius, color, 0.55)
    .setStrokeStyle(4, 0xffffff, 0.7)
    .setScrollFactor(0)
    .setDepth(2000)
    .setInteractive({ useHandCursor: true });

  const text = scene.add.text(x, y, label, {
    fontFamily: 'Fredoka',
    fontSize: `${Math.round(radius * 0.6)}px`,
    fontStyle: '700',
    color: '#ffffff',
  })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(2001);

  const press = () => {
    state.isDown = true;
    bg.fillAlpha = 0.85;
    bg.setStrokeStyle(4, 0xffffff, 0.95);
    if (!holdable && onTap) onTap();
  };
  const release = () => {
    state.isDown = false;
    bg.fillAlpha = 0.55;
    bg.setStrokeStyle(4, 0xffffff, 0.7);
  };

  bg.on('pointerdown', press);
  bg.on('pointerup', release);
  bg.on('pointerout', release);
  bg.on('pointerupoutside', release);
  bg.on('pointercancel', release);

  return {
    isDown: () => state.isDown,
    bg,
    text,
    destroy() { bg.destroy(); text.destroy(); },
  };
}
