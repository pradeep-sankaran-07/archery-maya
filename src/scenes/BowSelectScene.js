import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, BOWS, ARROW_COLORS, CHARACTERS } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { save } from '../save.js';

export default class BowSelectScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.BowSelect); }

  create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfff7e6, 0xfff7e6, 0xffe6c0, 0xffe6c0, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 50, 'Pick a bow and arrow!', {
      fontFamily: 'Fredoka', fontSize: '40px', fontStyle: '700', color: '#3a1f5e',
    }).setOrigin(0.5);

    const state = this.registry.get('gameState');
    const char = CHARACTERS.find((c) => c.id === state.character) || CHARACTERS[0];
    let bowId = state.bow || BOWS[0].id;
    let arrowId = state.arrow || ARROW_COLORS[0].id;

    // Live preview pane (left)
    const previewX = 350, previewY = 350;
    this.add.image(previewX, previewY, `char_${char.id}_idle`).setScale(1.6);
    const bowSprite = this.add.image(previewX + 80, previewY, `bow_${bowId}_${arrowId}`).setScale(1.4);
    // Separate arrow image so the chosen color is clearly visible in the
    // preview. (The bow texture itself doesn't include the arrow.)
    const previewArrow = this.add.image(previewX + 120, previewY - 4, `arrow_${arrowId}`).setScale(1.6);
    previewArrow.setRotation(-0.12); // slight upward angle, nocked feel
    this.add.text(previewX, previewY + 160, char.name, {
      fontFamily: 'Fredoka', fontSize: '28px', fontStyle: '700', color: '#3a1f5e',
    }).setOrigin(0.5);

    // Bow choices
    this.add.text(750, 130, 'Bow', { fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '600', color: '#3a1f5e' });
    const bowButtons = [];
    BOWS.forEach((b, i) => {
      const x = 760 + (i % 2) * 220;
      const y = 180 + Math.floor(i / 2) * 120;
      const card = this.add.graphics();
      const drawCard = (selected) => {
        card.clear();
        card.fillStyle(selected ? 0xffd966 : 0xffffff, 1);
        card.fillRoundedRect(x, y, 180, 100, 14);
        card.lineStyle(3, selected ? 0xff5a5f : 0x3a1f5e, selected ? 1 : 0.4);
        card.strokeRoundedRect(x, y, 180, 100, 14);
      };
      drawCard(b.id === bowId);
      const img = this.add.image(x + 60, y + 50, `bow_${b.id}_${arrowId}`).setScale(0.9);
      this.add.text(x + 110, y + 50, b.name, {
        fontFamily: 'Fredoka', fontSize: '18px', color: '#3a1f5e',
      }).setOrigin(0, 0.5);
      const hit = this.add.rectangle(x + 90, y + 50, 180, 100, 0x000000, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        bowId = b.id;
        SFX.select();
        bowButtons.forEach((entry) => entry.draw(entry.id === bowId));
        bowSprite.setTexture(`bow_${bowId}_${arrowId}`);
        startBtn.setLabel(`Start!  ▶`);
      });
      bowButtons.push({ id: b.id, draw: drawCard });
    });

    // Arrow color choices
    this.add.text(750, 460, 'Arrow color', { fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '600', color: '#3a1f5e' });
    const arrowButtons = [];
    ARROW_COLORS.forEach((a, i) => {
      const x = 760 + i * 145;
      const y = 510;
      const card = this.add.graphics();
      const drawCard = (selected) => {
        card.clear();
        card.fillStyle(selected ? 0xffd966 : 0xffffff, 1);
        card.fillRoundedRect(x, y, 120, 100, 14);
        card.lineStyle(3, selected ? 0xff5a5f : 0x3a1f5e, selected ? 1 : 0.4);
        card.strokeRoundedRect(x, y, 120, 100, 14);
      };
      drawCard(a.id === arrowId);
      this.add.image(x + 60, y + 36, `arrow_${a.id}`);
      this.add.text(x + 60, y + 76, a.name, {
        fontFamily: 'Fredoka', fontSize: '18px', color: '#3a1f5e',
      }).setOrigin(0.5);
      const hit = this.add.rectangle(x + 60, y + 50, 120, 100, 0x000000, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        arrowId = a.id;
        SFX.select();
        arrowButtons.forEach((entry) => entry.draw(entry.id === arrowId));
        bowSprite.setTexture(`bow_${bowId}_${arrowId}`);
        previewArrow.setTexture(`arrow_${arrowId}`);
      });
      arrowButtons.push({ id: a.id, draw: drawCard });
    });

    const startBtn = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 50, 'Start!  ▶', {
      width: 280, height: 64, fontSize: 28,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        state.bow = bowId;
        state.arrow = arrowId;
        state.money = 0;
        save({ lastBow: bowId, lastArrow: arrowId });
        this.scene.start(SCENE_KEYS.House);
      },
    });

    makeButton(this, 100, GAME_HEIGHT - 50, '← Back', {
      width: 130, height: 50, fontSize: 20,
      color: 0xeeeeee, hoverColor: 0xffffff, textColor: '#3a1f5e',
      onClick: () => this.scene.start(SCENE_KEYS.CharacterSelect),
    });
  }
}
