import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, CHARACTERS, PALETTE } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.Victory); }

  create() {
    const state = this.registry.get('gameState');
    const char = CHARACTERS.find((c) => c.id === state.character) || CHARACTERS[0];

    // Sky gradient (sunset celebration)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffd9b0, 0xffd9b0, 0xff7eb3, 0x8b5fbf, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ground
    const groundY = GAME_HEIGHT - 120;
    const grass = this.add.graphics();
    grass.fillStyle(PALETTE.grass, 1); grass.fillRect(0, groundY, GAME_WIDTH, 120);
    grass.fillStyle(PALETTE.grassDark, 1);
    for (let x = 0; x < GAME_WIDTH; x += 22) {
      grass.fillTriangle(x, groundY, x + 11, groundY - 14, x + 22, groundY);
    }

    // Flagpole + flag at top
    const poleX = GAME_WIDTH / 2 + 200;
    this.add.image(poleX, groundY, 'flagpole').setOrigin(0.5, 1);
    this.add.image(poleX + 28, groundY - 260, 'flag').setOrigin(0, 0.5);

    // Character
    this.add.image(poleX - 80, groundY - 40, `char_${char.id}_idle`).setScale(1.4);

    // Confetti emitters
    this.add.particles(GAME_WIDTH / 2, 0, 'particle_gold', {
      x: { min: 0, max: GAME_WIDTH }, y: -10,
      lifespan: 2400, speed: { min: 50, max: 180 },
      gravityY: 220, scale: { start: 1.5, end: 0 },
      tint: [0xff5a5f, 0xffa94a, 0xffc94a, 0x4caf50, 0x4a90e2, 0x8b5fbf],
      frequency: 80, quantity: 2,
    });

    // Big text
    this.add.text(GAME_WIDTH / 2, 140, '🎉  You did it!  🎉', {
      fontFamily: 'Fredoka', fontSize: '64px', fontStyle: '700',
      color: '#fff7e6', stroke: '#3a1f5e', strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 220, `${char.name}, you saved the day!`, {
      fontFamily: 'Fredoka', fontSize: '32px', color: '#3a1f5e',
    }).setOrigin(0.5);

    // Stats panel
    const sv = this.registry.get('save');
    this.add.text(GAME_WIDTH / 2, 320,
      `Total money: $${state.money}\n` +
      `Archery high score: $${sv.highScores?.archery1 ?? 0}\n` +
      `Moving target high: $${sv.highScores?.archery2 ?? 0}`,
      {
        fontFamily: 'Fredoka', fontSize: '24px', color: '#fff7e6',
        align: 'center', lineSpacing: 8, backgroundColor: '#3a1f5ecc',
        padding: { x: 24, y: 16 },
      }).setOrigin(0.5);

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 80, 'Play again  ▶', {
      width: 300, height: 70, fontSize: 28,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        SFX.select();
        this.scene.start(SCENE_KEYS.Title);
      },
    });

    SFX.victory();
  }
}
