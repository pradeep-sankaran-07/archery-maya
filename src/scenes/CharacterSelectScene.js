import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, CHARACTERS } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { save } from '../save.js';

const GROUPS = ['Kids', 'Grown-ups', 'Pets'];

// Per-group layout. Grown-ups has 11 entries so it gets smaller cells.
const LAYOUTS = {
  Kids:        { cellW: 110, baseScale: 0.55, hoverScale: 0.60, selectedScale: 0.70, ringR: 34, startX: 60 },
  'Grown-ups': { cellW: 100, baseScale: 0.50, hoverScale: 0.55, selectedScale: 0.62, ringR: 30, startX: 50 },
  Pets:        { cellW: 110, baseScale: 0.55, hoverScale: 0.60, selectedScale: 0.70, ringR: 34, startX: 60 },
};

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.CharacterSelect); }

  create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfff7e6, 0xfff7e6, 0xffe6c0, 0xffe6c0, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 36, 'Choose your hero!', {
      fontFamily: 'Fredoka', fontSize: '38px', fontStyle: '700',
      color: '#3a1f5e',
    }).setOrigin(0.5);

    const state = this.registry.get('gameState');
    let selectedId = state.character || CHARACTERS[0].id;
    if (!CHARACTERS.find((c) => c.id === selectedId)) selectedId = CHARACTERS[0].id;
    const portraits = new Map();

    // Lay out groups vertically. With 3 groups we have plenty of room.
    let y = 90;
    GROUPS.forEach((group) => {
      const inGroup = CHARACTERS.filter((c) => c.group === group);
      if (!inGroup.length) return;
      const layout = LAYOUTS[group];
      this.add.text(layout.startX - 10, y, group, {
        fontFamily: 'Fredoka', fontSize: '22px', fontStyle: '600',
        color: '#5a3a8a',
      });
      inGroup.forEach((c, idx) => {
        const x = layout.startX + idx * layout.cellW + layout.cellW / 2;
        const yy = y + 70;
        const portrait = this.add.image(x, yy, `portrait_${c.id}`).setScale(layout.baseScale);
        portrait.setInteractive({ useHandCursor: true });
        const nameTxt = this.add.text(x, yy + 50, c.name, {
          fontFamily: 'Fredoka', fontSize: '15px', color: '#3a1f5e',
        }).setOrigin(0.5);
        portrait.on('pointerover', () =>
          this.tweens.add({ targets: portrait, scale: layout.hoverScale, duration: 120 })
        );
        portrait.on('pointerout', () => {
          if (selectedId !== c.id)
            this.tweens.add({ targets: portrait, scale: layout.baseScale, duration: 120 });
        });
        portrait.on('pointerdown', () => {
          selectedId = c.id;
          SFX.select();
          portraits.forEach((p, id) => {
            const sel = id === selectedId;
            p.portrait.setScale(sel ? p.layout.selectedScale : p.layout.baseScale);
            p.ring.setVisible(sel);
            p.nameTxt.setColor(sel ? '#ff5a5f' : '#3a1f5e');
          });
          startBtn.setLabel(`Play as ${c.name}  ▶`);
        });
        const ring = this.add.graphics();
        ring.lineStyle(3, 0xff5a5f, 1);
        ring.strokeCircle(x, yy, layout.ringR);
        ring.setVisible(selectedId === c.id);
        if (selectedId === c.id) {
          portrait.setScale(layout.selectedScale);
          nameTxt.setColor('#ff5a5f');
        }
        portraits.set(c.id, { portrait, ring, nameTxt, layout });
      });
      y += 150;
    });

    const startBtn = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 50,
      `Play as ${CHARACTERS.find((c) => c.id === selectedId).name}  ▶`, {
      width: 320, height: 64, fontSize: 26,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        state.character = selectedId;
        save({ lastCharacter: selectedId });
        this.scene.start(SCENE_KEYS.BowSelect);
      },
    });

    makeButton(this, 100, GAME_HEIGHT - 50, '← Back', {
      width: 130, height: 50, fontSize: 20,
      color: 0xeeeeee, hoverColor: 0xffffff, textColor: '#3a1f5e',
      onClick: () => this.scene.start(SCENE_KEYS.Title),
    });
  }
}
