export function createHUD(scene, { hearts = 0, money = 0, label = '' } = {}) {
  const hud = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
  // top-left money pill
  const pill = scene.add.graphics();
  pill.fillStyle(0x000000, 0.4);
  pill.fillRoundedRect(16, 12, 180, 40, 20);
  hud.add(pill);
  const coinIcon = scene.add.image(40, 32, 'coin').setScale(0.8);
  hud.add(coinIcon);
  const moneyText = scene.add
    .text(60, 22, `$${money}`, {
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

  return {
    container: hud,
    setMoney(v) { moneyText.setText(`$${v}`); },
    setLabel(v) { if (labelText) labelText.setText(v); },
    setHearts(filled) {
      heartIcons.forEach((icon, i) => {
        icon.setTexture(i < filled ? 'heart' : 'heart_empty');
      });
    },
  };
}
