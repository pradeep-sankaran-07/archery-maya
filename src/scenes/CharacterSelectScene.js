import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, CHARACTERS } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { save } from '../save.js';
import { t } from '../i18n/index.js';

const GROUPS = ['Kids', 'Grown-ups', 'Pets'];

// Each "slot" is a fixed-size cell. The portrait scales inside the slot
// without affecting the name position, so there is never any text overlap.
const SLOT_W = 110;   // width of one character cell
const SLOT_H = 132;   // height of one character cell (portrait + name + padding)
const PORTRAIT_SIZE = 96; // bounding circle drawn behind the portrait

const GROUP_LAYOUTS = {
  Kids:        { slotW: 130, portraitScale: 0.62, selectedScale: 0.72 },
  'Grown-ups': { slotW: 105, portraitScale: 0.50, selectedScale: 0.58 },
  Pets:        { slotW: 130, portraitScale: 0.62, selectedScale: 0.72 },
};

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.CharacterSelect); }

  create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfff7e6, 0xfff7e6, 0xffe6c0, 0xffe6c0, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 30, t('charSelect.heading'), {
      fontFamily: 'Fredoka', fontSize: '34px', fontStyle: '700',
      color: '#3a1f5e',
    }).setOrigin(0.5, 0);

    const state = this.registry.get('gameState');
    let selectedId = state.character || CHARACTERS[0].id;
    if (!CHARACTERS.find((c) => c.id === selectedId)) selectedId = CHARACTERS[0].id;
    const slots = new Map();

    // Vertical layout: 3 groups stacked, each with generous breathing room
    // around its label so the label never crowds the cards above.
    let groupY = 76;
    GROUPS.forEach((group) => {
      const inGroup = CHARACTERS.filter((c) => c.group === group);
      if (!inGroup.length) return;
      const lay = GROUP_LAYOUTS[group];
      const rowW = inGroup.length * lay.slotW;
      const startX = (GAME_WIDTH - rowW) / 2;

      // Group label, left-aligned with the row
      this.add.text(startX, groupY, t(`charSelect.group.${group}`), {
        fontFamily: 'Fredoka', fontSize: '22px', fontStyle: '600',
        color: '#5a3a8a',
      }).setOrigin(0, 0);

      const rowY = groupY + 50;
      inGroup.forEach((c, idx) => {
        const slotX = startX + idx * lay.slotW;
        const cx = slotX + lay.slotW / 2;
        const portraitCy = rowY + 46;  // portrait centered in slot top half
        const nameCy = rowY + 110;     // FIXED name position — never moves

        // Slot card background — makes the cell visually clear
        const slotBg = this.add.graphics();
        const drawSlot = (selected) => {
          slotBg.clear();
          slotBg.fillStyle(selected ? 0xfff1c5 : 0xffffff, selected ? 1 : 0.75);
          slotBg.fillRoundedRect(slotX + 6, rowY, lay.slotW - 12, SLOT_H - 5, 12);
          slotBg.lineStyle(selected ? 4 : 2, selected ? 0xff5a5f : 0x3a1f5e, selected ? 1 : 0.25);
          slotBg.strokeRoundedRect(slotX + 6, rowY, lay.slotW - 12, SLOT_H - 5, 12);
        };
        drawSlot(c.id === selectedId);

        // Portrait — scales only the image itself, NOT the slot
        const portrait = this.add.image(cx, portraitCy, `portrait_${c.id}`)
          .setScale(c.id === selectedId ? lay.selectedScale : lay.portraitScale);

        // Name — fixed position; never moves regardless of portrait scale
        const nameTxt = this.add.text(cx, nameCy, c.name, {
          fontFamily: 'Fredoka', fontSize: '15px', fontStyle: '600',
          color: c.id === selectedId ? '#ff5a5f' : '#3a1f5e',
        }).setOrigin(0.5);

        // Hit area covers the whole slot so the entire card is clickable
        const hit = this.add.rectangle(cx, rowY + SLOT_H / 2, lay.slotW - 8, SLOT_H - 6, 0x000000, 0)
          .setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
          if (selectedId !== c.id) {
            this.tweens.add({ targets: portrait, scale: lay.portraitScale * 1.05, duration: 100 });
          }
        });
        hit.on('pointerout', () => {
          if (selectedId !== c.id) {
            this.tweens.add({ targets: portrait, scale: lay.portraitScale, duration: 100 });
          }
        });
        hit.on('pointerdown', () => {
          selectedId = c.id;
          SFX.select();
          slots.forEach((s, id) => {
            const sel = id === selectedId;
            s.drawSlot(sel);
            s.portrait.setScale(sel ? s.layout.selectedScale : s.layout.portraitScale);
            s.nameTxt.setColor(sel ? '#ff5a5f' : '#3a1f5e');
          });
          startBtn.setLabel(t('charSelect.playAs', { name: c.name }));
        });

        slots.set(c.id, { portrait, nameTxt, drawSlot, layout: lay });
      });

      groupY += 195;
    });

    const startBtn = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 50,
      t('charSelect.playAs', { name: CHARACTERS.find((c) => c.id === selectedId).name }), {
      width: 320, height: 60, fontSize: 24,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        state.character = selectedId;
        save({ lastCharacter: selectedId });
        this.scene.start(SCENE_KEYS.BowSelect);
      },
    });

    makeButton(this, 90, GAME_HEIGHT - 50, t('charSelect.back'), {
      width: 120, height: 48, fontSize: 18,
      color: 0xeeeeee, hoverColor: 0xffffff, textColor: '#3a1f5e',
      onClick: () => this.scene.start(SCENE_KEYS.Title),
    });
  }
}
