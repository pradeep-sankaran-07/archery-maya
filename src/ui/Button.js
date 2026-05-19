import { SFX } from '../art/audio.js';

export function makeButton(scene, x, y, label, opts = {}) {
  const {
    width = 220,
    height = 60,
    color = 0xffc94a,
    hoverColor = 0xffd966,
    textColor = '#3a230a',
    fontSize = 26,
    onClick = () => {},
  } = opts;
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const draw = (c) => {
    bg.clear();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 14);
    bg.fillStyle(c, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.lineStyle(3, 0xffffff, 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
  };
  draw(color);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: '700',
      color: textColor,
    })
    .setOrigin(0.5);
  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerover', () => {
    draw(hoverColor);
    scene.tweens.add({ targets: container, scale: 1.05, duration: 100 });
  });
  container.on('pointerout', () => {
    draw(color);
    scene.tweens.add({ targets: container, scale: 1.0, duration: 100 });
  });
  container.on('pointerdown', () => {
    scene.tweens.add({ targets: container, scale: 0.95, duration: 60, yoyo: true });
    SFX.click();
    onClick();
  });
  container.setLabel = (newLabel) => text.setText(newLabel);
  return container;
}
