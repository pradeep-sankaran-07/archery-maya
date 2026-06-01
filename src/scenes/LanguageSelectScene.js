import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, PALETTE } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { detectLanguage, setLanguage } from '../i18n/index.js';
import { SFX } from '../art/audio.js';

export default class LanguageSelectScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.LanguageSelect); }

  create() {
    const detected = detectLanguage();

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x9bdcf2, 0x9bdcf2, 0xffd9b0, 0xffd9b0, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sun
    this.add.circle(GAME_WIDTH - 200, 160, 70, PALETTE.sun, 0.9);
    this.add.circle(GAME_WIDTH - 200, 160, 100, PALETTE.sun, 0.35);

    // Grass
    const grass = this.add.graphics();
    grass.fillStyle(PALETTE.grass, 1);
    grass.fillRect(0, GAME_HEIGHT - 120, GAME_WIDTH, 120);
    grass.fillStyle(PALETTE.grassDark, 1);
    for (let x = 0; x < GAME_WIDTH; x += 20) {
      grass.fillTriangle(x, GAME_HEIGHT - 120, x + 10, GAME_HEIGHT - 134, x + 20, GAME_HEIGHT - 120);
    }

    // Title card
    const cardW = 700, cardH = 380;
    const cardX = GAME_WIDTH / 2 - cardW / 2;
    const cardY = GAME_HEIGHT / 2 - cardH / 2 - 20;
    const card = this.add.graphics();
    card.fillStyle(0xfff7e6, 0.97);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 28);
    card.lineStyle(4, 0x3a1f5e, 1);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 28);

    // Bilingual heading (always shown in both languages)
    this.add.text(GAME_WIDTH / 2, cardY + 44, 'Choose your language  /  Velg språk', {
      fontFamily: 'Fredoka', fontSize: '28px', fontStyle: '600',
      color: '#3a1f5e',
    }).setOrigin(0.5);

    // Language buttons — side by side
    const btnY = cardY + 190;
    const enX = GAME_WIDTH / 2 - 170;
    const noX = GAME_WIDTH / 2 + 170;

    // Highlight the auto-detected language with a stronger border ring
    const enHighlight = this.add.graphics();
    const noHighlight = this.add.graphics();
    const drawHighlight = (g, cx, cy, active) => {
      g.clear();
      if (!active) return;
      g.lineStyle(5, 0xff5a5f, 1);
      g.strokeRoundedRect(cx - 147, cy - 47, 294, 94, 20);
    };
    drawHighlight(enHighlight, enX, btnY, detected === 'en');
    drawHighlight(noHighlight, noX, btnY, detected === 'no');

    const enBtn = makeButton(this, enX, btnY, '🇬🇧  English', {
      width: 280, height: 84, fontSize: 30,
      color: detected === 'en' ? 0x4caf50 : 0xffffff,
      hoverColor: detected === 'en' ? 0x6bc06f : 0xfff7e6,
      textColor: detected === 'en' ? '#ffffff' : '#3a1f5e',
      onClick: () => {
        SFX.select();
        setLanguage('en');
        this.scene.start(SCENE_KEYS.Title);
      },
    });

    const noBtn = makeButton(this, noX, btnY, '🇳🇴  Norsk', {
      width: 280, height: 84, fontSize: 30,
      color: detected === 'no' ? 0x4caf50 : 0xffffff,
      hoverColor: detected === 'no' ? 0x6bc06f : 0xfff7e6,
      textColor: detected === 'no' ? '#ffffff' : '#3a1f5e',
      onClick: () => {
        SFX.select();
        setLanguage('no');
        this.scene.start(SCENE_KEYS.Title);
      },
    });

    // Auto-detect hint below buttons
    const hint = detected === 'no'
      ? 'Nettleseren din er norsk — Norsk er forhåndsvalgt'
      : 'Your browser language is detected as English — English pre-selected';
    this.add.text(GAME_WIDTH / 2, cardY + cardH - 50, hint, {
      fontFamily: 'Fredoka', fontSize: '16px', color: '#6a5288',
    }).setOrigin(0.5);
  }
}
