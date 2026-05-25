import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { loadLeaderboard, addLeaderboardEntry } from '../save.js';

export default class LeaderboardScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.Leaderboard); }

  create() {
    const state = this.registry.get('gameState');
    const runScore = state.money | 0;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffd9b0, 0xffd9b0, 0xff9ec1, 0x8b5fbf, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 60, '🏆  High Scores', {
      fontFamily: 'Fredoka', fontSize: '52px', fontStyle: '700',
      color: '#fff7e6', stroke: '#3a1f5e', strokeThickness: 8,
    }).setOrigin(0.5);

    // Two-column layout: list on left, name entry on right
    const listX = 60, listY = 130, listW = 640;

    // Left card — top 10 leaderboard
    const listBg = this.add.graphics();
    listBg.fillStyle(0xfff7e6, 0.95);
    listBg.fillRoundedRect(listX, listY, listW, 480, 18);
    listBg.lineStyle(4, 0x3a1f5e, 1);
    listBg.strokeRoundedRect(listX, listY, listW, 480, 18);
    this.add.text(listX + 24, listY + 14, 'Top 10', {
      fontFamily: 'Fredoka', fontSize: '28px', fontStyle: '700', color: '#3a1f5e',
    });

    const entries = loadLeaderboard().slice(0, 10);
    if (entries.length === 0) {
      this.add.text(listX + listW / 2, listY + 240, 'No scores yet —\nbe the first!', {
        fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '600',
        color: '#3a1f5e', align: 'center',
      }).setOrigin(0.5);
    } else {
      const rowH = 36;
      entries.forEach((e, i) => {
        const y = listY + 60 + i * rowH;
        const rank = `${i + 1}.`;
        const dateStr = formatDate(e.date);
        // rank
        this.add.text(listX + 24, y, rank, {
          fontFamily: 'Fredoka', fontSize: '20px', fontStyle: '700',
          color: i === 0 ? '#c4951c' : '#3a1f5e',
        });
        // name (truncated)
        this.add.text(listX + 70, y, e.name, {
          fontFamily: 'Fredoka', fontSize: '20px', fontStyle: '600',
          color: '#3a1f5e',
        });
        // score
        this.add.text(listX + 360, y, `${e.score} kr`, {
          fontFamily: 'Fredoka', fontSize: '20px', fontStyle: '700',
          color: '#3a1f5e',
        });
        // date
        this.add.text(listX + 500, y, dateStr, {
          fontFamily: 'Fredoka', fontSize: '16px',
          color: '#6a5288',
        });
      });
    }

    // Right card — your score + name entry
    const cardX = 740, cardY = 130, cardW = 480;
    const card = this.add.graphics();
    card.fillStyle(0xfff7e6, 0.95);
    card.fillRoundedRect(cardX, cardY, cardW, 480, 18);
    card.lineStyle(4, 0x3a1f5e, 1);
    card.strokeRoundedRect(cardX, cardY, cardW, 480, 18);

    this.add.text(cardX + cardW / 2, cardY + 40, 'Your score', {
      fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '600', color: '#5a3a8a',
    }).setOrigin(0.5);
    this.add.text(cardX + cardW / 2, cardY + 100, `${runScore} kr`, {
      fontFamily: 'Fredoka', fontSize: '64px', fontStyle: '700',
      color: '#ff5a5f', stroke: '#3a1f5e', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cardX + cardW / 2, cardY + 180, 'Type your name:', {
      fontFamily: 'Fredoka', fontSize: '22px', fontStyle: '600', color: '#3a1f5e',
    }).setOrigin(0.5);

    // HTML <input> overlaid on the canvas via absolute CSS. We attach it to
    // the page body and update its position whenever the canvas resizes —
    // this avoids Phaser's DOMContainer which doesn't always scale cleanly
    // under Scale.FIT on mobile.
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 12;
    this.nameInput.placeholder = 'Player';
    this.nameInput.autocapitalize = 'words';
    this.nameInput.autocomplete = 'off';
    this.nameInput.spellcheck = false;
    this.nameInput.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      'transform-origin:center center',
      'padding:0 16px',
      'font-family:Fredoka, sans-serif',
      'font-weight:600',
      'color:#3a1f5e',
      'background:#ffffff',
      'border:3px solid #3a1f5e',
      'border-radius:14px',
      'outline:none',
      'text-align:center',
      'box-sizing:border-box',
      'z-index:50',
    ].join(';');
    document.body.appendChild(this.nameInput);

    // Position the input so it sits at game-coords (cardX + cardW/2, cardY + 240)
    // and re-position on viewport changes (orientation, resize, fullscreen).
    const inputGameX = cardX + cardW / 2;
    const inputGameY = cardY + 240;
    const repositionInput = () => {
      const canvas = this.game.canvas;
      if (!canvas || !this.nameInput) return;
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / GAME_WIDTH;
      // Use min sizes so the input stays usable on tiny screens. On phones
      // this means the input may visually overflow the (small) right card,
      // but it's still clearly tappable and readable.
      const w = Math.max(220, 300 * scale);
      const h = Math.max(48, 54 * scale);
      const screenX = rect.left + inputGameX * scale - w / 2;
      const screenY = rect.top + inputGameY * scale - h / 2;
      this.nameInput.style.width = `${w}px`;
      this.nameInput.style.height = `${h}px`;
      this.nameInput.style.fontSize = `${Math.max(18, Math.round(28 * scale))}px`;
      this.nameInput.style.left = `${screenX}px`;
      this.nameInput.style.top = `${screenY}px`;
    };
    repositionInput();
    // Reposition on Phaser scale events and on window resize.
    this.scale.on('resize', repositionInput);
    window.addEventListener('resize', repositionInput);
    this._repositionInput = repositionInput;

    // Save & shop button
    makeButton(this, cardX + cardW / 2, cardY + 360, 'Save & shop  ▶', {
      width: 320, height: 64, fontSize: 24,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => {
        SFX.select();
        const name = (this.nameInput && this.nameInput.value) || 'Player';
        addLeaderboardEntry({ name, score: runScore });
        // Initialise the gift-shop cart on the registry before transitioning.
        const gs = this.registry.get('gameState');
        gs.cart = [];
        gs.playerName = name;
        this.scene.start(SCENE_KEYS.GiftShop);
      },
    });

    // Skip-link in case they don't want to shop
    makeButton(this, cardX + cardW / 2, cardY + 430, 'Skip shopping', {
      width: 200, height: 44, fontSize: 18,
      color: 0xeeeeee, hoverColor: 0xffffff, textColor: '#3a1f5e',
      onClick: () => {
        const name = (this.nameInput && this.nameInput.value) || 'Player';
        addLeaderboardEntry({ name, score: runScore });
        this.scene.start(SCENE_KEYS.Title);
      },
    });

    // Clean up the HTML input + listeners on scene exit so they don't linger.
    const cleanup = () => {
      if (this._repositionInput) {
        this.scale.off('resize', this._repositionInput);
        window.removeEventListener('resize', this._repositionInput);
        this._repositionInput = null;
      }
      if (this.nameInput && this.nameInput.parentNode) this.nameInput.parentNode.removeChild(this.nameInput);
      this.nameInput = null;
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}
