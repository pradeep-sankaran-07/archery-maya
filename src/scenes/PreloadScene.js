import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { generateAllTextures } from '../art/sprites.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.Preload); }

  create() {
    // Gradient sky background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x9bdcf2, 0x9bdcf2, 0x1a1230, 0x3a1f5e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, 'Archery Maya', {
      fontFamily: 'Fredoka',
      fontSize: '64px',
      fontStyle: '700',
      color: '#fff7e6',
      stroke: '#3a1f5e',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, 'Loading…', {
      fontFamily: 'Fredoka',
      fontSize: '24px',
      color: '#fff7e6',
    }).setOrigin(0.5);

    // Generate textures (synchronous; one tick)
    this.time.delayedCall(50, () => {
      generateAllTextures(this);
      subtitle.setText('Ready!');
      this.time.delayedCall(300, () => {
        this.scene.start(SCENE_KEYS.LanguageSelect);
      });
    });
  }
}
