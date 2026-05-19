import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, CHARACTERS, BOWS, ARROW_COLORS, PALETTE, PHYSICS, CURRENCY } from '../config.js';
import { createHUD } from '../ui/HUD.js';
import { makeButton } from '../ui/Button.js';
import { SFX } from '../art/audio.js';
import { save } from '../save.js';

const ARROWS_PER_ROUND = 8;

export default class ArcheryRangeScene extends Phaser.Scene {
  constructor(key) {
    super(key || SCENE_KEYS.Archery1);
    this.sceneKey = key || SCENE_KEYS.Archery1;
    this.moving = false;
  }

  init(data) {
    this.moving = !!(data && data.moving);
  }

  create() {
    const state = this.registry.get('gameState');
    const char = CHARACTERS.find((c) => c.id === state.character) || CHARACTERS[0];
    const bow = BOWS.find((b) => b.id === state.bow) || BOWS[0];
    const arrow = ARROW_COLORS.find((a) => a.id === state.arrow) || ARROW_COLORS[0];

    this.physics.world.gravity.y = PHYSICS.arrowGravity;

    // Background: gradient + clouds + grass
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x9bdcf2, 0x9bdcf2, 0xffd9b0, 0xffd9b0, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add.circle(GAME_WIDTH - 160, 130, 60, PALETTE.sun, 0.95);
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(180 + i * 320, 80 + (i % 2) * 40, 'cloud').setAlpha(0.95);
      this.tweens.add({ targets: c, x: c.x + 60, duration: 9000 + i * 800, yoyo: true, repeat: -1 });
    }

    const groundY = GAME_HEIGHT - 110;
    const grass = this.add.graphics();
    grass.fillStyle(PALETTE.grass, 1);
    grass.fillRect(0, groundY, GAME_WIDTH, 110);
    grass.fillStyle(PALETTE.grassDark, 1);
    for (let x = 0; x < GAME_WIDTH; x += 22) {
      grass.fillTriangle(x, groundY, x + 11, groundY - 14, x + 22, groundY);
    }

    // "Archery range" sign — sits below the top-center logo banner
    this.add.text(GAME_WIDTH / 2, 80, this.moving ? 'Moving Target Range' : 'Archery Range', {
      fontFamily: 'Fredoka', fontSize: '28px', fontStyle: '700',
      color: '#ffffff', stroke: '#3a1f5e', strokeThickness: 6,
    }).setOrigin(0.5, 0);

    // Player stand (left side)
    const standX = 130;
    const standY = groundY - 10;
    const stand = this.add.graphics();
    stand.fillStyle(PALETTE.dirtDark, 1);
    stand.fillRect(standX - 60, standY - 6, 120, 18);
    this.player = this.add.image(standX, standY - 60, `char_${char.id}_idle`).setScale(1.1);

    // Bow held in hand — sprite we rotate
    this.bow = this.add.image(standX + 30, standY - 80, `bow_${bow.id}_${arrow.id}`).setScale(0.9);
    this.aimAngle = -0.35;
    this.bow.setRotation(this.aimAngle);

    // Aim line (parabolic preview)
    this.aimGraphics = this.add.graphics();

    // Targets
    this.targets = [];
    this.spawnTargets();

    // Arrows group (we manage manually)
    this.activeArrows = [];

    // Game state
    this.arrowsLeft = ARROWS_PER_ROUND;
    this.roundMoney = 0;
    this.hud = createHUD(this, { money: state.money, label: `Arrows left: ${this.arrowsLeft}`, character: char });

    // Aim hint
    this.add.text(GAME_WIDTH / 2, 125,
      'Hold ↑ or ↓ to aim • SPACE to shoot', {
        fontFamily: 'Fredoka', fontSize: '18px', color: '#3a1f5e',
        backgroundColor: '#fff7e6cc', padding: { x: 12, y: 6 },
      }).setOrigin(0.5);

    // Coin particle emitter
    this.coinEmitter = this.add.particles(0, 0, 'particle_gold', {
      lifespan: 600, speed: { min: 80, max: 180 }, scale: { start: 1.2, end: 0 },
      gravityY: 300, emitting: false,
    });

    // Keys
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });
    this.keys.space.on('down', () => this.shoot());
    this.keys.enter.on('down', () => this.shoot());

    // Touch shoot button (small fallback)
    if (this.sys.game.device.input.touch) {
      makeButton(this, GAME_WIDTH - 100, GAME_HEIGHT - 50, '🏹 Shoot', {
        width: 160, height: 60, fontSize: 22, color: 0xff5a5f, hoverColor: 0xff8a8a, textColor: '#ffffff',
        onClick: () => this.shoot(),
      });
    }
  }

  spawnTargets() {
    // Smaller targets at widely-spread positions. Each needs a unique aim
    // angle (different range AND different height). The flatter arc from
    // v1 is gone — arrows now arc noticeably, so the player has to lead.
    const TARGET_SCALE = 0.62;
    const positions = this.moving
      ? [
          { x: 720, y: 290 }, { x: 940, y: 440 }, { x: 1180, y: 240 },
        ]
      : [
          { x: 560, y: 470 }, // closest, low
          { x: 740, y: 270 }, // mid, high
          { x: 900, y: 410 }, // mid-far, low
          { x: 1060, y: 220 }, // far, top
          { x: 1200, y: 360 }, // farthest, mid
        ];
    positions.forEach((p, i) => {
      const img = this.add.image(p.x, p.y, 'target').setScale(TARGET_SCALE);
      const target = {
        sprite: img,
        baseX: p.x, baseY: p.y,
        radius: 56 * TARGET_SCALE,
        active: true,
        speed: 60 + i * 40,
        phase: i * 0.6,
      };
      this.targets.push(target);
    });
  }

  update(_t, dt) {
    const dts = dt / 1000;
    if (this.keys.up.isDown) this.aimAngle = Math.max(-1.2, this.aimAngle - 1.2 * dts);
    if (this.keys.down.isDown) this.aimAngle = Math.min(0.35, this.aimAngle + 1.2 * dts);
    this.bow.setRotation(this.aimAngle);

    // Aim preview parabola
    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(2, 0xffffff, 0.6);
    const startX = this.bow.x + Math.cos(this.aimAngle) * 30;
    const startY = this.bow.y + Math.sin(this.aimAngle) * 30;
    const vx = Math.cos(this.aimAngle) * PHYSICS.arrowSpeed;
    const vy = Math.sin(this.aimAngle) * PHYSICS.arrowSpeed;
    for (let i = 0; i < 30; i++) {
      const t = i * 0.04;
      const px = startX + vx * t;
      const py = startY + vy * t + 0.5 * PHYSICS.arrowGravity * t * t;
      if (px > GAME_WIDTH || py > GAME_HEIGHT - 100) break;
      if (i % 2 === 0) this.aimGraphics.fillStyle(0xffffff, 0.7).fillCircle(px, py, 2);
    }

    // Move moving targets on sine paths
    if (this.moving) {
      this.targets.forEach((t, i) => {
        if (!t.active) return;
        const wave = Math.sin(this.time.now / 600 + t.phase) * 100;
        t.sprite.y = t.baseY + wave;
      });
    }

    // Update arrows. Stuck arrows ride their target (works for both static and
    // moving targets — static targets simply don't move).
    for (const a of this.activeArrows) {
      if (a.stuck) {
        if (a.stuckTo && a.stuckTo.active) {
          a.sprite.setPosition(
            a.stuckTo.sprite.x + a.stuckOffsetX,
            a.stuckTo.sprite.y + a.stuckOffsetY,
          );
        }
        continue;
      }
      a.vy += PHYSICS.arrowGravity * dts;
      a.x += a.vx * dts;
      a.y += a.vy * dts;
      a.sprite.setPosition(a.x, a.y);
      a.sprite.setRotation(Math.atan2(a.vy, a.vx));
      // collide with targets — only the painted face counts. The hit radius
      // is well inside the outer ring so glancing shots no longer stick.
      for (const t of this.targets) {
        if (!t.active) continue;
        const dx = a.x - t.sprite.x;
        const dy = a.y - t.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < t.radius * 0.82) {
          this.handleHit(a, t, dist);
          break;
        }
      }
      // off-screen or hit ground
      if (a.y > GAME_HEIGHT - 100) {
        a.y = GAME_HEIGHT - 100;
        a.stuck = true;
        a.sprite.setRotation(0.3);
      }
      if (a.x > GAME_WIDTH + 60) a.stuck = true;
    }
  }

  shoot() {
    if (this.arrowsLeft <= 0) return;
    const state = this.registry.get('gameState');
    const arrow = ARROW_COLORS.find((a) => a.id === state.arrow);
    this.arrowsLeft -= 1;
    this.hud.setLabel(`Arrows left: ${this.arrowsLeft}`);
    SFX.shoot();
    const startX = this.bow.x + Math.cos(this.aimAngle) * 24;
    const startY = this.bow.y + Math.sin(this.aimAngle) * 24;
    const sprite = this.add.image(startX, startY, `arrow_${arrow.id}`).setOrigin(0.85, 0.5);
    sprite.setRotation(this.aimAngle);
    const a = {
      sprite,
      x: startX, y: startY,
      vx: Math.cos(this.aimAngle) * PHYSICS.arrowSpeed,
      vy: Math.sin(this.aimAngle) * PHYSICS.arrowSpeed,
      stuck: false,
    };
    this.activeArrows.push(a);
    // Small recoil tween on player
    this.tweens.add({ targets: this.player, x: this.player.x - 4, duration: 70, yoyo: true });
    if (this.arrowsLeft === 0) this.time.delayedCall(2500, () => this.finishRound());
  }

  handleHit(arrow, target, dist) {
    arrow.stuck = true;
    // Anchor the arrow to the target so it rides along (matters on moving targets)
    arrow.stuckTo = target;
    arrow.stuckOffsetX = (arrow.x - target.sprite.x) * 0.92;
    arrow.stuckOffsetY = (arrow.y - target.sprite.y) * 0.92;
    arrow.sprite.setPosition(target.sprite.x + arrow.stuckOffsetX, target.sprite.y + arrow.stuckOffsetY);
    // Score by ring within the painted face. Center = best prize.
    // (Distances are fractions of the *outer* radius. Hit detection above
    // already rejects anything past 0.82, so the edge band starts there.)
    const r = target.radius;
    let prize = 1;
    if (dist < r * 0.18) prize = this.moving ? 10 : 6;
    else if (dist < r * 0.36) prize = this.moving ? 6 : 4;
    else if (dist < r * 0.58) prize = this.moving ? 4 : 2;
    else prize = this.moving ? 2 : 1;
    if (dist < r * 0.18) SFX.bullseye(); else SFX.hit();
    SFX.coin();
    // Show floating prize text
    const t = this.add.text(target.sprite.x, target.sprite.y - 30, `+${prize} kr`, {
      fontFamily: 'Fredoka', fontSize: '28px', fontStyle: '700',
      color: '#ffe066', stroke: '#3a1f5e', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    this.coinEmitter.emitParticleAt(target.sprite.x, target.sprite.y, 12);
    // Money
    this.roundMoney += prize;
    const state = this.registry.get('gameState');
    state.money += prize;
    this.hud.setMoney(state.money);
    // bounce target
    this.tweens.add({ targets: target.sprite, scale: 0.95, duration: 90, yoyo: true });
  }

  finishRound() {
    const state = this.registry.get('gameState');
    const sv = this.registry.get('save');
    const hsKey = this.moving ? 'archery2' : 'archery1';
    if (!sv.highScores[hsKey] || this.roundMoney > sv.highScores[hsKey]) {
      sv.highScores[hsKey] = this.roundMoney;
      save({ highScores: sv.highScores });
    }
    save({ totalMoney: state.money });

    // End-of-round panel
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setDepth(2000);
    const card = this.add.graphics().setDepth(2001);
    card.fillStyle(0xfff7e6, 1);
    card.fillRoundedRect(GAME_WIDTH / 2 - 280, GAME_HEIGHT / 2 - 160, 560, 320, 24);
    card.lineStyle(4, 0x3a1f5e, 1);
    card.strokeRoundedRect(GAME_WIDTH / 2 - 280, GAME_HEIGHT / 2 - 160, 560, 320, 24);

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80,
      `Nice shooting!\n\nYou earned ${this.roundMoney} kr this round.\nTotal: ${state.money} kr`,
      {
        fontFamily: 'Fredoka', fontSize: '28px', color: '#3a1f5e',
        align: 'center', lineSpacing: 8,
      }).setOrigin(0.5).setDepth(2002);

    const nextLabel = this.moving ? 'On to the adventure  ▶' : 'Off to the store  ▶';
    const nextScene = this.moving ? SCENE_KEYS.Adventure : SCENE_KEYS.Grocery;
    const btn = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, nextLabel, {
      width: 360, height: 64, fontSize: 24,
      color: 0x4caf50, hoverColor: 0x6bc06f, textColor: '#ffffff',
      onClick: () => this.scene.start(nextScene),
    });
    btn.setDepth(2003);
  }
}
