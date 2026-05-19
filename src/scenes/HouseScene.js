import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, CHARACTERS, PALETTE } from '../config.js';
import { SFX } from '../art/audio.js';

export default class HouseScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.House); }

  create() {
    const state = this.registry.get('gameState');
    const char = CHARACTERS.find((c) => c.id === state.character) || CHARACTERS[0];

    // Sky
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x9bdcf2, 0x9bdcf2, 0xffd9b0, 0xffd9b0, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sun
    this.add.circle(GAME_WIDTH - 180, 140, 70, PALETTE.sun, 0.95);

    // Clouds
    for (let i = 0; i < 3; i++) {
      const c = this.add.image(220 + i * 380, 100 + (i % 2) * 40, 'cloud');
      this.tweens.add({ targets: c, x: c.x + 60, duration: 9000 + i * 800, yoyo: true, repeat: -1 });
    }

    // Grass strip
    const groundY = GAME_HEIGHT - 120;
    const grass = this.add.graphics();
    grass.fillStyle(PALETTE.grass, 1);
    grass.fillRect(0, groundY, GAME_WIDTH, 120);
    grass.fillStyle(PALETTE.grassDark, 1);
    for (let x = 0; x < GAME_WIDTH; x += 22) {
      grass.fillTriangle(x, groundY, x + 11, groundY - 14, x + 22, groundY);
    }

    // House
    const house = this.add.image(180, groundY - 70, 'house').setOrigin(0.5, 0.5).setScale(1.1);

    // Character starting inside the door, walks right
    const player = this.add.image(180, groundY - 30, `char_${char.id}_idle`).setScale(1.0);
    player.setAlpha(0); // hidden behind door
    this.tweens.add({ targets: player, alpha: 1, duration: 400, delay: 600 });

    // "Door opens" little hint
    const hint = this.add.text(GAME_WIDTH / 2, 60, `${char.name} is heading out to the archery range!`, {
      fontFamily: 'Fredoka', fontSize: '28px', fontStyle: '600',
      color: '#3a1f5e', backgroundColor: '#fff7e6cc', padding: { x: 16, y: 8 },
    }).setOrigin(0.5);

    // Walk path
    this.tweens.add({
      targets: player,
      x: GAME_WIDTH - 120,
      duration: 4500,
      delay: 800,
      onUpdate: () => {
        // tiny bob
        player.setY(groundY - 30 + Math.sin(this.time.now / 100) * 2);
      },
      onComplete: () => {
        this.scene.start(SCENE_KEYS.Archery1);
      },
    });

    // Tap-to-skip
    const skip = this.add.text(GAME_WIDTH - 24, GAME_HEIGHT - 24, 'press any key to skip', {
      fontFamily: 'Fredoka', fontSize: '16px', color: '#3a1f5e',
    }).setOrigin(1, 1);
    this.input.keyboard.on('keydown', () => {
      this.scene.start(SCENE_KEYS.Archery1);
    });
    this.input.on('pointerdown', () => this.scene.start(SCENE_KEYS.Archery1));
  }
}
