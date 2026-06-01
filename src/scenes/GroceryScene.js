import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, ITEMS, PALETTE, CHARACTERS } from '../config.js';
import { createHUD } from '../ui/HUD.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { pickProblems } from '../math/problems.js';
import { save } from '../save.js';
import { t, getCurrentLang } from '../i18n/index.js';

const PROBLEMS_PER_PLAY = 8;

export default class GroceryScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.Grocery); }

  create() {
    const state = this.registry.get('gameState');
    const char = CHARACTERS.find((c) => c.id === state.character) || CHARACTERS[0];

    // Store interior — soft yellow walls
    const bg = this.add.graphics();
    bg.fillStyle(0xfff1d6, 1); bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0xeacb95, 1); bg.fillRect(0, GAME_HEIGHT - 110, GAME_WIDTH, 110);

    // Title — sits below the top-center logo banner
    this.add.text(GAME_WIDTH / 2, 80, t('grocery.title'), {
      fontFamily: 'Fredoka', fontSize: '26px', fontStyle: '700',
      color: '#3a1f5e',
    }).setOrigin(0.5);

    // Single shelf row at top — all 15 items, fixed slot widths so prices
    // line up cleanly and never overlap the question card below.
    const shelfTop = 120;
    const shelfBottom = 240;
    const shelfStripe = this.add.graphics();
    shelfStripe.fillStyle(0x8b5a2b, 1);
    shelfStripe.fillRect(20, shelfBottom - 4, GAME_WIDTH - 40, 6);
    shelfStripe.fillStyle(0x6b3f25, 1);
    shelfStripe.fillRect(20, shelfBottom + 2, GAME_WIDTH - 40, 4);

    const SLOT_W = 80;
    const rowW = ITEMS.length * SLOT_W;
    const rowStartX = (GAME_WIDTH - rowW) / 2;
    ITEMS.forEach((it, i) => {
      const x = rowStartX + i * SLOT_W + SLOT_W / 2;
      this.add.text(x, shelfTop + 30, it.emoji, { fontSize: '36px' }).setOrigin(0.5);
      this.add.text(x, shelfTop + 80, `${it.price} kr`, {
        fontFamily: 'Fredoka', fontSize: '14px', fontStyle: '700',
        color: '#fff7e6', backgroundColor: '#3a1f5e', padding: { x: 5, y: 2 },
      }).setOrigin(0.5);
    });

    // Cashier table
    const tableY = GAME_HEIGHT - 110;
    this.add.rectangle(GAME_WIDTH / 2, tableY, GAME_WIDTH, 8, 0x8b5a2b);

    // Character on left of cashier area (below shelves and to the side of card)
    this.add.image(80, GAME_HEIGHT - 75, `char_${char.id}_idle`).setScale(0.95);

    this.hud = createHUD(this, { money: state.money, label: t('grocery.hudLabel'), character: char });

    // Pick 6 random problems
    this.problems = pickProblems(PROBLEMS_PER_PLAY, state.money, Date.now(), getCurrentLang());
    this.problemIndex = 0;
    this.firstTryCorrect = 0;
    this.shownProblem = null;

    this.nextProblem();
  }

  nextProblem() {
    if (this.shownProblem) this.shownProblem.destroy();
    if (this.problemIndex >= this.problems.length) {
      this.finish();
      return;
    }
    const p = this.problems[this.problemIndex];
    // Card centered in the clear area between shelf bottom (~240) and
    // the cashier table top (~610). Card spans y=270 to y=590.
    const cardTopY = 270;
    const cardW = 900, cardH = 320;
    const cardCx = GAME_WIDTH / 2;
    const cardCy = cardTopY + cardH / 2;
    this.shownProblem = this.add.container(cardCx, cardCy);

    // Card bg
    const card = this.add.graphics();
    card.fillStyle(0xfff7e6, 1);
    card.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 24);
    card.lineStyle(4, 0x3a1f5e, 1);
    card.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 24);
    this.shownProblem.add(card);

    // Progress dot indicator — drawn first so it sits below the text in z-order
    const dots = this.add.container(0, -cardH / 2 + 22);
    for (let i = 0; i < this.problems.length; i++) {
      const dot = this.add.circle(-((this.problems.length - 1) * 9) + i * 18, 0, 6,
        i < this.problemIndex ? 0x4caf50 : i === this.problemIndex ? 0xff5a5f : 0xbbbbbb);
      dots.add(dot);
    }
    this.shownProblem.add(dots);

    // Question text — added after dots so it renders on top; top-anchored so
    // multi-line prompts grow downward and never overlap the dots row above.
    const qTxt = this.add.text(0, -cardH / 2 + 46, p.prompt, {
      fontFamily: 'Fredoka', fontSize: '24px', color: '#3a1f5e',
      align: 'center', lineSpacing: 8, wordWrap: { width: cardW - 60 },
    }).setOrigin(0.5, 0);
    this.shownProblem.add(qTxt);

    // Choices
    const choices = p.choices.map(String);
    const isYesNo = p.type === 'yesno';
    const btnY = cardH / 2 - 70;
    let firstWrong = false;
    choices.forEach((choice, idx) => {
      const spacing = cardW / (choices.length + 1);
      const x = -cardW / 2 + spacing * (idx + 1);
      const label = isYesNo ? (choice === 'yes' ? t('grocery.yes') : t('grocery.no')) : choice;
      const w = isYesNo ? 200 : Math.max(120, Math.min(220, 30 + label.length * 18));
      const btn = makeButton(this, x, btnY, label, {
        width: w, height: 64, fontSize: 26,
        color: isYesNo ? (choice === 'yes' ? 0x4caf50 : 0xff7e7e) : 0x4a90e2,
        hoverColor: isYesNo ? (choice === 'yes' ? 0x6bc06f : 0xff9a9a) : 0x6aa9eb,
        textColor: '#ffffff',
        onClick: () => {
          const correct = String(p.correct).toLowerCase() === choice.toLowerCase();
          if (correct) {
            SFX.correct();
            if (!firstWrong) this.firstTryCorrect += 1;
            // Bonus coin for hard problems
            const state = this.registry.get('gameState');
            state.money += 1;
            this.hud.setMoney(state.money);
            this.popStar(this.shownProblem.x + x, this.shownProblem.y + btnY);
            this.problemIndex += 1;
            this.time.delayedCall(700, () => this.nextProblem());
          } else {
            firstWrong = true;
            SFX.wrong();
            this.tweens.add({ targets: btn, x: x - 6, duration: 60, yoyo: true, repeat: 2 });
            // After second wrong, reveal answer
            if (!btn._wrongCount) btn._wrongCount = 0;
            btn._wrongCount += 1;
            if (btn._wrongCount >= 2) {
              this.revealAnswer(p);
            }
          }
        },
      });
      this.shownProblem.add(btn);
    });
  }

  popStar(x, y) {
    const star = this.add.text(x, y - 40, '⭐', { fontSize: '40px' }).setOrigin(0.5);
    this.tweens.add({
      targets: star, y: y - 120, alpha: 0, scale: 2, duration: 900,
      onComplete: () => star.destroy(),
    });
  }

  revealAnswer(p) {
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 200,
      t('grocery.revealHint', { correct: p.correct }), {
      fontFamily: 'Fredoka', fontSize: '22px', color: '#ff5a5f',
      backgroundColor: '#fff7e6', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(2000);
    this.time.delayedCall(3000, () => hint.destroy());
  }

  finish() {
    const state = this.registry.get('gameState');
    const bonus = 5;
    // Streak bonus: 6+ correct → 5 kr; perfect 8/8 → 10 kr
    let streak = 0;
    if (this.firstTryCorrect >= this.problems.length) streak = 10;
    else if (this.firstTryCorrect >= 6) streak = 5;
    state.money += bonus + streak;
    this.hud.setMoney(state.money);
    save({ totalMoney: state.money });

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setDepth(2000);
    const card = this.add.graphics().setDepth(2001);
    card.fillStyle(0xfff7e6, 1);
    card.fillRoundedRect(GAME_WIDTH / 2 - 320, GAME_HEIGHT / 2 - 180, 640, 360, 24);
    card.lineStyle(4, 0x3a1f5e, 1);
    card.strokeRoundedRect(GAME_WIDTH / 2 - 320, GAME_HEIGHT / 2 - 180, 640, 360, 24);

    const txt = t('grocery.resultBase', { firstTry: this.firstTryCorrect, total: this.problems.length, bonus }) +
      (streak ? t('grocery.resultStreak', { streak }) : '') +
      t('grocery.resultTotal', { money: state.money });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, txt, {
      fontFamily: 'Fredoka', fontSize: '24px', color: '#3a1f5e',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(2002);

    makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, t('grocery.nextMoving'), {
      width: 380, height: 64, fontSize: 24,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => this.scene.start(SCENE_KEYS.Archery2),
    }).setDepth(2003);
  }
}
