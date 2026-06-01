import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { t } from '../i18n/index.js';

export const SHOP_ITEMS = [
  { id: 'bear',       name: 'Stuffed bear',     emoji: '🧸', price: 15 },
  { id: 'unicorn',    name: 'Stuffed unicorn',  emoji: '🦄', price: 20 },
  { id: 'octopus',    name: 'Squishy octopus',  emoji: '🐙', price: 12 },
  { id: 'squishball', name: 'Squishy ball',     emoji: '🩷', price: 8  },
  { id: 'lolli',      name: 'Lollipop',         emoji: '🍭', price: 4  },
  { id: 'yoyo',       name: 'Yo-yo',            emoji: '🪀', price: 7  },
  { id: 'balloon',    name: 'Balloon',          emoji: '🎈', price: 3  },
  { id: 'paint',      name: 'Paint set',        emoji: '🎨', price: 25 },
  { id: 'kite',       name: 'Kite',             emoji: '🪁', price: 14 },
  { id: 'socks',      name: 'Funny socks',      emoji: '🧦', price: 10 },
  { id: 'undies',     name: 'Underwear',        emoji: '🩲', price: 2  },
  { id: 'diaper',     name: 'Diaper',           emoji: '🍼', price: 1  },
  { id: 'banana',     name: 'Banana peel',      emoji: '🍌', price: 1  },
  { id: 'chicken',    name: 'Rubber chicken',   emoji: '🐔', price: 6  },
  { id: 'kazoo',      name: 'Kazoo',            emoji: '🎺', price: 5  },
  { id: 'whoopee',    name: 'Whoopee cushion',  emoji: '💨', price: 5  },
  { id: 'mustache',   name: 'Fake mustache',    emoji: '👨', price: 3  },
  { id: 'glow',       name: 'Glow stick',       emoji: '⭐', price: 4  },
  { id: 'sticker',    name: 'Sticker pack',     emoji: '✨', price: 6  },
  { id: 'diamond',    name: 'Plastic diamond',  emoji: '💎', price: 50 },
];

export default class GiftShopScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.GiftShop); }

  create() {
    const state = this.registry.get('gameState');
    if (!Array.isArray(state.cart)) state.cart = [];

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfff7e6, 0xfff7e6, 0xffd9b0, 0xff9ec1, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Header
    this.add.text(GAME_WIDTH / 2, 40, t('giftShop.title'), {
      fontFamily: 'Fredoka', fontSize: '36px', fontStyle: '700',
      color: '#3a1f5e',
    }).setOrigin(0.5);
    this.moneyText = this.add.text(GAME_WIDTH / 2, 80, t('giftShop.youHave', { money: state.money }), {
      fontFamily: 'Fredoka', fontSize: '24px', fontStyle: '600',
      color: '#ff5a5f',
    }).setOrigin(0.5);

    // Catalogue tile grid — left 70%; 5 cols × 4 rows
    this.tileLookup = new Map(); // id → { tile, refresh }
    const gridX = 40, gridY = 130;
    const cols = 5, rows = 4;
    const tileW = 140, tileH = 130, gapX = 8, gapY = 8;
    SHOP_ITEMS.forEach((item, idx) => {
      const r = Math.floor(idx / cols), c = idx % cols;
      const x = gridX + c * (tileW + gapX);
      const y = gridY + r * (tileH + gapY);
      this.buildTile(item, x, y, tileW, tileH);
    });

    // Cart panel on the right
    const cartX = 800;
    this.add.text(cartX, 120, t('giftShop.cart'), {
      fontFamily: 'Fredoka', fontSize: '24px', fontStyle: '700',
      color: '#3a1f5e',
    });
    this.cartContainer = this.add.container(cartX, 160);
    this.refreshCart();

    // Bottom: Done shopping button
    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 50, t('giftShop.done'), {
      width: 280, height: 60, fontSize: 24,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        SFX.select();
        this.scene.start(SCENE_KEYS.PrizeShowcase);
      },
    });

    // Inline status / error line (e.g. "Not enough kronor"). Positioned just
    // above the Done button. Empty until something tries to buy unaffordably.
    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 110, '', {
      fontFamily: 'Fredoka', fontSize: '20px', fontStyle: '600',
      color: '#c63b3e',
    }).setOrigin(0.5);
  }

  buildTile(item, x, y, w, h) {
    const state = this.registry.get('gameState');
    const tile = this.add.container(x, y);
    const bg = this.add.graphics();
    const emoji = this.add.text(w / 2, 38, item.emoji, { fontSize: '44px' }).setOrigin(0.5);
    const name = this.add.text(w / 2, 78, t(`shop.${item.id}.name`), {
      fontFamily: 'Fredoka', fontSize: '15px', fontStyle: '600',
      color: '#3a1f5e', align: 'center', wordWrap: { width: w - 12 },
    }).setOrigin(0.5);
    const price = this.add.text(w / 2, 108, `${item.price} kr`, {
      fontFamily: 'Fredoka', fontSize: '17px', fontStyle: '700',
      color: '#fff7e6', backgroundColor: '#3a1f5e', padding: { x: 8, y: 2 },
    }).setOrigin(0.5);
    const check = this.add.text(w - 18, 12, '✓', {
      fontFamily: 'Fredoka', fontSize: '24px', fontStyle: '700',
      color: '#4caf50',
    }).setOrigin(1, 0).setVisible(false);
    tile.add([bg, emoji, name, price, check]);
    tile.setSize(w, h);
    tile.setInteractive({ useHandCursor: true });

    const refresh = () => {
      const owned = state.cart.includes(item.id);
      const affordable = state.money >= item.price;
      bg.clear();
      if (owned) {
        bg.fillStyle(0xd6f5d6, 1);
      } else if (affordable) {
        bg.fillStyle(0xffffff, 1);
      } else {
        bg.fillStyle(0xeeeeee, 0.9);
      }
      bg.fillRoundedRect(0, 0, w, h, 14);
      bg.lineStyle(3, owned ? 0x4caf50 : affordable ? 0x3a1f5e : 0xbbbbbb,
                   owned || affordable ? 1 : 0.5);
      bg.strokeRoundedRect(0, 0, w, h, 14);
      emoji.setAlpha(owned ? 0.45 : affordable ? 1 : 0.55);
      name.setAlpha(owned ? 0.6 : affordable ? 1 : 0.55);
      price.setAlpha(owned ? 0.6 : 1);
      check.setVisible(owned);
    };
    refresh();
    this.tileLookup.set(item.id, { tile, refresh });

    tile.on('pointerdown', () => {
      const cur = this.registry.get('gameState');
      if (cur.cart.includes(item.id)) {
        // Already owned — no-op, gentle nudge
        SFX.click();
        return;
      }
      if (cur.money < item.price) {
        this.flashNotEnough(tile, item);
        return;
      }
      cur.money -= item.price;
      cur.cart.push(item.id);
      SFX.coin();
      this.moneyText.setText(t('giftShop.youHave', { money: cur.money }));
      this.refreshAllTiles();
      this.refreshCart();
    });
  }

  flashNotEnough(tile, item) {
    SFX.wrong();
    // Shake the tile briefly
    this.tweens.add({
      targets: tile, x: tile.x - 8, duration: 60, yoyo: true, repeat: 2,
    });
    const need = item.price - this.registry.get('gameState').money;
    this.statusText.setText(t('giftShop.notEnough', { name: t(`shop.${item.id}.name`), need }));
    if (this._statusFadeTimer) this._statusFadeTimer.remove(false);
    this._statusFadeTimer = this.time.delayedCall(2200, () => this.statusText.setText(''));
  }

  refreshAllTiles() {
    this.tileLookup.forEach(({ refresh }) => refresh());
  }

  refreshCart() {
    const state = this.registry.get('gameState');
    this.cartContainer.removeAll(true);
    if (!state.cart || state.cart.length === 0) {
      const empty = this.add.text(0, 0, t('giftShop.cartEmpty'), {
        fontFamily: 'Fredoka', fontSize: '18px', color: '#5a3a8a',
      });
      this.cartContainer.add(empty);
      return;
    }
    state.cart.forEach((id, idx) => {
      const item = SHOP_ITEMS.find((it) => it.id === id);
      if (!item) return;
      const y = idx * 38;
      const emoji = this.add.text(0, y, item.emoji, { fontSize: '24px' });
      const name = this.add.text(36, y + 2, `${t(`shop.${item.id}.name`)}  (${item.price} kr)`, {
        fontFamily: 'Fredoka', fontSize: '16px', color: '#3a1f5e',
      });
      // Refund ✕
      const x = this.add.text(360, y + 2, '✕', {
        fontFamily: 'Fredoka', fontSize: '18px', fontStyle: '700',
        color: '#c63b3e', backgroundColor: '#fff7e6', padding: { x: 6, y: 1 },
      }).setInteractive({ useHandCursor: true });
      x.on('pointerdown', () => {
        const cur = this.registry.get('gameState');
        cur.money += item.price;
        cur.cart.splice(cur.cart.indexOf(id), 1);
        SFX.click();
        this.moneyText.setText(t('giftShop.youHave', { money: cur.money }));
        this.refreshAllTiles();
        this.refreshCart();
      });
      this.cartContainer.add([emoji, name, x]);
    });
  }
}
