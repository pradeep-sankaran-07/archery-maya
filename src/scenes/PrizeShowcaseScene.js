import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, CHARACTERS, PALETTE } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { SHOP_ITEMS } from './GiftShopScene.js';
import { t } from '../i18n/index.js';

export default class PrizeShowcaseScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.PrizeShowcase); }

  create() {
    const state = this.registry.get('gameState');
    const char = CHARACTERS.find((c) => c.id === state.character) || CHARACTERS[0];
    const cart = Array.isArray(state.cart) ? state.cart : [];

    // Sunset celebration background
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

    // Title
    const playerName = state.playerName || 'Player';
    this.add.text(GAME_WIDTH / 2, 70, t('prizeShowcase.title', { name: playerName }), {
      fontFamily: 'Fredoka', fontSize: '38px', fontStyle: '700',
      color: '#fff7e6', stroke: '#3a1f5e', strokeThickness: 7,
    }).setOrigin(0.5);

    // Confetti — auto-emit
    this.add.particles(GAME_WIDTH / 2, 0, 'particle_gold', {
      x: { min: 0, max: GAME_WIDTH }, y: -10,
      lifespan: 2600, speed: { min: 50, max: 180 },
      gravityY: 220, scale: { start: 1.4, end: 0 },
      tint: [0xff5a5f, 0xffa94a, 0xffc94a, 0x4caf50, 0x4a90e2, 0x8b5fbf],
      frequency: 90, quantity: 2,
    });

    // Character center-bottom
    this.add.image(GAME_WIDTH / 2, groundY - 60, `char_${char.id}_idle`).setScale(1.5);

    if (cart.length === 0) {
      // Empty cart fallback
      this.add.text(GAME_WIDTH / 2, 240,
        t('prizeShowcase.emptyCart'), {
          fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '600',
          color: '#fff7e6', stroke: '#3a1f5e', strokeThickness: 5,
          align: 'center', lineSpacing: 8,
        }).setOrigin(0.5);
    } else {
      // Fan items around the character
      const cx = GAME_WIDTH / 2;
      const cy = groundY - 80;
      const radius = 240;
      const half = Math.PI; // half-circle above the character
      cart.forEach((id, i) => {
        const item = SHOP_ITEMS.find((it) => it.id === id);
        if (!item) return;
        // Spread across a 200° arc centered upward
        const arc = (Math.PI * 200) / 180;
        const pos = cart.length === 1 ? 0 : (i / (cart.length - 1)) - 0.5;
        const angle = -Math.PI / 2 + pos * arc;
        const ix = cx + Math.cos(angle) * radius;
        const iy = cy + Math.sin(angle) * (radius * 0.85);
        const emoji = this.add.text(ix, iy, item.emoji, { fontSize: '54px' }).setOrigin(0.5);
        // Gentle bob
        this.tweens.add({
          targets: emoji, y: iy - 12, duration: 900 + (i % 5) * 80,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        // Label below
        const label = this.add.text(ix, iy + 38, t(`shop.${item.id}.name`), {
          fontFamily: 'Fredoka', fontSize: '13px', fontStyle: '600',
          color: '#3a1f5e', backgroundColor: '#fff7e6cc', padding: { x: 6, y: 2 },
        }).setOrigin(0.5);
        this.tweens.add({
          targets: label, y: label.y - 12, duration: 900 + (i % 5) * 80,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      });
    }

    // Play again button
    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 60, t('prizeShowcase.playAgain'), {
      width: 280, height: 64, fontSize: 26,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        SFX.victory();
        // Clear the run's state so a new game starts fresh
        const cur = this.registry.get('gameState');
        cur.cart = [];
        cur.money = 0;
        this.scene.start(SCENE_KEYS.Title);
      },
    });
  }
}
