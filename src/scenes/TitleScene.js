import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, PALETTE } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX, isMuted, setMuted } from '../art/audio.js';
import { save } from '../save.js';
import { t, getCurrentLang, setLanguage } from '../i18n/index.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.Title); }

  create() {
    // Sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x9bdcf2, 0x9bdcf2, 0xffd9b0, 0xffd9b0, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sun
    const sun = this.add.graphics();
    sun.fillStyle(PALETTE.sun, 0.9);
    sun.fillCircle(GAME_WIDTH - 200, 160, 70);
    sun.fillStyle(PALETTE.sun, 0.4);
    sun.fillCircle(GAME_WIDTH - 200, 160, 100);

    // Floating clouds
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(120 + i * 320, 100 + (i % 2) * 50, 'cloud').setAlpha(0.95);
      this.tweens.add({ targets: c, x: c.x + 60, duration: 8000 + i * 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Grass strip
    const grass = this.add.graphics();
    grass.fillStyle(PALETTE.grass, 1);
    grass.fillRect(0, GAME_HEIGHT - 120, GAME_WIDTH, 120);
    grass.fillStyle(PALETTE.grassDark, 1);
    for (let x = 0; x < GAME_WIDTH; x += 20) {
      grass.fillTriangle(x, GAME_HEIGHT - 120, x + 10, GAME_HEIGHT - 134, x + 20, GAME_HEIGHT - 120);
    }

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 220, t('title.gameTitle'), {
      fontFamily: 'Fredoka',
      fontSize: '96px',
      fontStyle: '700',
      color: '#ff5a5f',
      stroke: '#3a1f5e',
      strokeThickness: 10,
      shadow: { offsetX: 4, offsetY: 6, color: '#000', blur: 0, fill: true, stroke: false },
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.05, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(GAME_WIDTH / 2, 310, t('title.subtitle'), {
      fontFamily: 'Fredoka',
      fontSize: '28px',
      color: '#3a1f5e',
    }).setOrigin(0.5);

    // Buttons
    makeButton(this, GAME_WIDTH / 2, 440, t('title.play'), {
      width: 280, height: 80, fontSize: 36, color: 0x4caf50, hoverColor: 0x6bc06f,
      textColor: '#ffffff',
      onClick: () => {
        SFX.select();
        this.scene.start(SCENE_KEYS.CharacterSelect);
      },
    });

    makeButton(this, GAME_WIDTH / 2, 540, t('title.howToPlay'), {
      width: 240, height: 60, fontSize: 24, color: 0xffc94a, hoverColor: 0xffd966,
      onClick: () => this.showHelp(),
    });

    // Mute button
    const muteBtn = makeButton(this, GAME_WIDTH - 90, 50, isMuted() ? t('title.muted') : t('title.sound'), {
      width: 150, height: 44, fontSize: 18,
      color: 0xffffff, hoverColor: 0xfff7e6,
      onClick: () => {
        const m = !isMuted();
        setMuted(m);
        save({ muted: m });
        muteBtn.setLabel(m ? t('title.muted') : t('title.sound'));
      },
    });

    // Language toggle button (top-left)
    makeButton(this, 70, 50, t('lang.toggleLabel'), {
      width: 120, height: 44, fontSize: 18,
      color: 0x3a1f5e, hoverColor: 0x5a3a8a, textColor: '#fff7e6',
      onClick: () => {
        const next = getCurrentLang() === 'en' ? 'no' : 'en';
        setLanguage(next);
        this.scene.restart();
      },
    });

    // One-shot rotate hint for phones held in portrait
    const isPhonePortrait = window.innerWidth < window.innerHeight && window.innerWidth < 700;
    const alreadyShown = this.registry.get('rotateHintShown');
    if (isPhonePortrait && !alreadyShown) {
      this.registry.set('rotateHintShown', true);
      const hint = this.add.text(GAME_WIDTH / 2, 110,
        t('title.rotateHint'),
        {
          fontFamily: 'Fredoka', fontSize: '22px', fontStyle: '600',
          color: '#fff7e6', backgroundColor: '#3a1f5ee0',
          padding: { x: 18, y: 10 },
        }).setOrigin(0.5).setDepth(2500);
      this.time.delayedCall(5000, () =>
        this.tweens.add({ targets: hint, alpha: 0, duration: 800, onComplete: () => hint.destroy() }));
    }
  }

  showHelp() {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    overlay.setInteractive();
    const card = this.add.graphics();
    card.fillStyle(0xfff7e6, 1);
    card.fillRoundedRect(GAME_WIDTH / 2 - 320, GAME_HEIGHT / 2 - 220, 640, 440, 24);
    card.lineStyle(4, 0x3a1f5e, 1);
    card.strokeRoundedRect(GAME_WIDTH / 2 - 320, GAME_HEIGHT / 2 - 220, 640, 440, 24);

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80,
      t('title.helpBody'),
      {
        fontFamily: 'Fredoka', fontSize: '24px', color: '#3a1f5e',
        align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);

    const close = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, t('title.gotIt'), {
      width: 180, height: 56, fontSize: 24, color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => { overlay.destroy(); card.destroy(); text.destroy(); close.destroy(); },
    });
  }
}
