import { CURRENCY } from '../config.js';

export function createHUD(scene, { hearts = 0, money = 0, label = '', character = null } = {}) {
  const hud = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
  // top-left money pill
  const pill = scene.add.graphics();
  pill.fillStyle(0x000000, 0.4);
  pill.fillRoundedRect(16, 12, 200, 40, 20);
  hud.add(pill);
  const coinIcon = scene.add.image(40, 32, 'coin').setScale(0.8);
  hud.add(coinIcon);
  const moneyText = scene.add
    .text(60, 22, CURRENCY.format(money), {
      fontFamily: 'Fredoka',
      fontSize: '22px',
      fontStyle: '700',
      color: '#ffffff',
    });
  hud.add(moneyText);

  // top-right level label
  let labelText;
  if (label) {
    labelText = scene.add
      .text(scene.scale.width - 24, 20, label, {
        fontFamily: 'Fredoka',
        fontSize: '22px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#1a1230',
        strokeThickness: 4,
      })
      .setOrigin(1, 0);
    hud.add(labelText);
  }

  // hearts (under money)
  const heartIcons = [];
  if (hearts > 0) {
    for (let i = 0; i < hearts; i++) {
      const h = scene.add.image(34 + i * 30, 64, 'heart').setScale(0.85);
      heartIcons.push(h);
      hud.add(h);
    }
  }

  // Top-center logo + "Playing as <Name>" banner
  if (character) {
    const cx = scene.scale.width / 2;
    const logoBg = scene.add.graphics();
    logoBg.fillStyle(0x3a1f5e, 0.7);
    logoBg.fillRoundedRect(cx - 140, 8, 280, 52, 14);
    logoBg.lineStyle(2, 0xffc94a, 0.7);
    logoBg.strokeRoundedRect(cx - 140, 8, 280, 52, 14);
    hud.add(logoBg);
    const logo = scene.add.text(cx, 22, '🏹  Archery Maya', {
      fontFamily: 'Fredoka',
      fontSize: '18px',
      fontStyle: '700',
      color: '#fff7e6',
    }).setOrigin(0.5, 0);
    hud.add(logo);
    const sub = scene.add.text(cx, 44, `Playing as ${character.name}`, {
      fontFamily: 'Fredoka',
      fontSize: '13px',
      color: '#ffd966',
    }).setOrigin(0.5, 0);
    hud.add(sub);
  }

  return {
    container: hud,
    setMoney(v) { moneyText.setText(CURRENCY.format(v)); },
    setLabel(v) { if (labelText) labelText.setText(v); },
    setHearts(filled) {
      heartIcons.forEach((icon, i) => {
        icon.setTexture(i < filled ? 'heart' : 'heart_empty');
      });
    },
  };
}
