import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { t } from '../i18n/index.js';
import { fetchScores } from '../leaderboard.js';
import { createScoreList } from '../ui/ScoreList.js';

// Full-screen, view-only leaderboard reachable from the title screen.
export default class LeaderboardViewScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.LeaderboardView); }

  create() {
    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffd9b0, 0xffd9b0, 0xff9ec1, 0x8b5fbf, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, t('leaderboard.title'), {
      fontFamily: 'Fredoka', fontSize: '52px', fontStyle: '700',
      color: '#fff7e6', stroke: '#3a1f5e', strokeThickness: 8,
    }).setOrigin(0.5);

    // List card
    const cardX = 140, cardY = 120, cardW = 1000, cardH = 470;
    const card = this.add.graphics();
    card.fillStyle(0xfff7e6, 0.95);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 18);
    card.lineStyle(4, 0x3a1f5e, 1);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 18);

    // Loading text
    this.loadingText = this.add.text(GAME_WIDTH / 2, cardY + cardH / 2, t('leaderboard.loading'), {
      fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '600', color: '#3a1f5e',
    }).setOrigin(0.5);

    // Offline note (hidden until needed)
    this.offlineText = this.add.text(GAME_WIDTH / 2, cardY + cardH + 24, '', {
      fontFamily: 'Fredoka', fontSize: '16px', color: '#fff7e6',
    }).setOrigin(0.5);

    // Back button
    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 40, t('leaderboard.back'), {
      width: 220, height: 56, fontSize: 24,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        SFX.select();
        this.scene.start(SCENE_KEYS.Title);
      },
    });

    // Load scores asynchronously
    this.scoreList = null;
    fetchScores(100).then(({ entries, offline }) => {
      if (!this.scene.isActive()) return;
      if (this.loadingText) { this.loadingText.destroy(); this.loadingText = null; }
      this.scoreList = createScoreList(this, {
        x: cardX + 16, y: cardY + 16, w: cardW - 32, h: cardH - 32, entries,
      });
      if (offline) this.offlineText.setText(t('leaderboard.offline'));
    });

    // Clean up scroll listeners on exit
    const cleanup = () => { if (this.scoreList) { this.scoreList.destroy(); this.scoreList = null; } };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }
}
