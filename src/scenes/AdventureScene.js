import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, CHARACTERS, BOWS, ARROW_COLORS, PALETTE, PHYSICS } from '../config.js';
import { createHUD } from '../ui/HUD.js';
import { SFX } from '../art/audio.js';
import { save } from '../save.js';

const TILE = 64;
const WORLD_HEIGHT = 11; // tiles

/**
 * Level layout (text-encoded). Each char is one tile.
 *   .  empty (sky / water)
 *   #  solid ground (grass on top)
 *   =  solid dirt
 *   S  snake spawn (land)
 *   T  tiger spawn (land)
 *   K  shark spawn (water)
 *   J  jellyfish spawn (water)
 *   F  fish spawn (water)
 *   C  coin
 *   P  pipe (segment marker — entering changes segment)
 *   B  big block (raised platform)
 *   ^  spike (optional, unused for kid-friendly)
 *   G  goal flagpole
 *   |  segment break (vertical bar separating segments visually — same world)
 */

// Designed levels — chunk by chunk
const LAND_SEGMENT = [
  // 11 rows tall, ~40 columns wide
  '........................................',
  '........................................',
  '........................................',
  '..........C.............................',
  '....C.....=......C.C....................',
  '..........==......B.....................',
  '........................................',
  '.........C.............C................',
  '........T....S.....T.......S......C..P..',
  '##############################=#########',
  '########################################',
];

const WATER_SEGMENT = [
  '........................................',
  '....J............J............J........',
  '.................F....F.................',
  '..F....K..........................F.....',
  '.....................J............K....',
  '........F...K................F..........',
  '...J.............................J.....',
  '.....F....................F......F......',
  '..K..........F.....J......................',
  '............................K..F....P..',
  '########################################',
];

const FINAL_SEGMENT = [
  '........................................',
  '........................................',
  '...........................G............',
  '...........................|............',
  '....C............C.........|............',
  '..........=................|............',
  '..........==..............=|=...........',
  '.........................==|==..........',
  '...........................|............',
  '########################################',
  '########################################',
];

export default class AdventureScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.Adventure); }

  create() {
    const state = this.registry.get('gameState');
    this.charDef = CHARACTERS.find((c) => c.id === state.character) || CHARACTERS[0];
    this.bowDef = BOWS.find((b) => b.id === state.bow) || BOWS[0];
    this.arrowDef = ARROW_COLORS.find((a) => a.id === state.arrow) || ARROW_COLORS[0];

    this.physics.world.gravity.y = PHYSICS.gravity;

    this.segment = 'land';   // land | water | final
    this.hearts = 3;
    this.checkpoint = { segment: 'land', x: 120, y: 0 };

    // Build initial segment
    this.buildSegment(this.segment);

    // HUD
    this.hud = createHUD(this, { hearts: 3, money: state.money, label: 'Adventure!' });
    this.hud.setHearts(this.hearts);

    // Keys
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
    this.keys.space.on('down', () => this.shootArrow());
    this.keys.up.on('down', () => this.jumpOrSwim());

    // Hint banner
    this.hintTxt = this.add.text(GAME_WIDTH / 2, 70, '← → walk   ↑ jump   space shoot', {
      fontFamily: 'Fredoka', fontSize: '20px', color: '#fff7e6',
      backgroundColor: '#3a1f5ecc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1500);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: this.hintTxt, alpha: 0, duration: 1000 }));
  }

  buildSegment(segment) {
    // Tear down previous
    if (this.world) this.world.destroy(true);
    this.world = this.add.container(0, 0);
    this.segment = segment;
    this.platforms = this.physics.add.staticGroup();
    this.coins = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group({ allowGravity: segment !== 'water' });
    this.activeArrows = this.physics.add.group({ allowGravity: segment !== 'water' });
    this.flagpole = null;
    this.flagSprite = null;
    this.pipe = null;
    this.goalReached = false;

    const layout = segment === 'land' ? LAND_SEGMENT
      : segment === 'water' ? WATER_SEGMENT
      : FINAL_SEGMENT;

    const worldWidth = layout[0].length * TILE;
    const worldHeight = layout.length * TILE;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Background per segment
    this.drawBackground(segment, worldWidth, worldHeight);

    layout.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        switch (ch) {
          case '#': {
            const tex = segment === 'water' ? 'tile_rock' : 'tile_grass';
            const block = this.platforms.create(x, y, tex);
            block.refreshBody();
            break;
          }
          case '=': {
            const tex = segment === 'water' ? 'tile_rock' : 'tile_dirt';
            const block = this.platforms.create(x, y, tex);
            block.refreshBody();
            break;
          }
          case 'B': {
            const tex = segment === 'water' ? 'tile_rock' : 'tile_grass';
            const block = this.platforms.create(x, y, tex);
            block.refreshBody();
            break;
          }
          case 'C': {
            const coin = this.coins.create(x, y, 'coin');
            coin.value = 1;
            this.tweens.add({ targets: coin, y: y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            break;
          }
          case 'S': this.spawnEnemy(x, y, 'snake'); break;
          case 'T': this.spawnEnemy(x, y, 'tiger'); break;
          case 'K': this.spawnEnemy(x, y, 'shark'); break;
          case 'J': this.spawnEnemy(x, y, 'jellyfish'); break;
          case 'F': this.spawnEnemy(x, y, 'fish'); break;
          case 'P': this.spawnPipe(x, y); break;
          case 'G': this.spawnFlag(c * TILE, r * TILE); break;
          default: break;
        }
      }
    });

    // Player
    const spawnX = this.checkpoint.segment === segment ? this.checkpoint.x : 120;
    const spawnY = 200;
    this.player = this.physics.add.sprite(spawnX, spawnY, `char_${this.charDef.id}_idle`).setScale(0.9);
    this.player.body.setSize(48, 100, true);
    this.player.body.setOffset(24, 28);
    this.player.facing = 'right';
    this.player.invincibleUntil = 0;
    this.player.lastShoot = 0;

    // collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.coins, (_p, coin) => this.collectCoin(coin));
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.playerHitEnemy(e));
    this.physics.add.overlap(this.activeArrows, this.enemies, (arrow, e) => this.arrowHitEnemy(arrow, e));
    this.physics.add.collider(this.activeArrows, this.platforms, (arrow) => arrow.destroy());

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Underwater physics tweaks
    if (segment === 'water') {
      this.physics.world.gravity.y = PHYSICS.swimGravity;
      this.player.body.setMaxVelocity(260, 220);
    } else {
      this.physics.world.gravity.y = PHYSICS.gravity;
      this.player.body.setMaxVelocity(360, 800);
    }

    this.checkpoint = { segment, x: spawnX, y: spawnY };

    if (segment === 'final') {
      // Build a tiny goal trigger
    }
  }

  drawBackground(segment, w, h) {
    const bg = this.add.graphics();
    if (segment === 'water') {
      bg.fillGradientStyle(0x3596d5, 0x3596d5, 0x0e3a66, 0x0e3a66, 1);
      bg.fillRect(0, 0, w, h);
      // bubbles
      for (let i = 0; i < 30; i++) {
        const bub = this.add.image(Math.random() * w, Math.random() * h, 'bubble').setAlpha(0.6);
        this.tweens.add({ targets: bub, y: bub.y - 200 - Math.random() * 200, duration: 6000 + Math.random() * 4000, repeat: -1 });
      }
    } else {
      bg.fillGradientStyle(0x9bdcf2, 0x9bdcf2, 0xffd9b0, 0xffd9b0, 1);
      bg.fillRect(0, 0, w, h);
      // clouds
      for (let i = 0; i < 6; i++) {
        const c = this.add.image(150 + i * 380, 60 + (i % 2) * 50, 'cloud').setAlpha(0.95);
        this.tweens.add({ targets: c, x: c.x + 50, duration: 8000 + i * 600, yoyo: true, repeat: -1 });
      }
      this.add.circle(w - 200, 110, 60, PALETTE.sun, 0.95);
    }
  }

  spawnEnemy(x, y, kind) {
    const e = this.enemies.create(x, y, kind);
    e.kind = kind;
    e.body.setBounce(0);
    e.body.setCollideWorldBounds(false);
    if (kind === 'snake') {
      e.setVelocityX(-40);
      e.body.setSize(80, 18, true);
    } else if (kind === 'tiger') {
      e.body.setSize(100, 50, true);
      e.setVelocityX(-30);
    } else if (kind === 'shark') {
      e.body.setAllowGravity(false);
      e.setVelocityX(-60);
      e.baseY = y;
    } else if (kind === 'jellyfish') {
      e.body.setAllowGravity(false);
      e.setVelocityY(-40);
      e.baseY = y;
      e.shootable = false;
    } else if (kind === 'fish') {
      e.body.setAllowGravity(false);
      e.setVelocityX(40 + Math.random() * 30);
      e.baseY = y;
      e.value = 3;
    }
    return e;
  }

  spawnPipe(x, y) {
    const pipe = this.add.image(x, y - TILE * 0.3, 'pipe').setOrigin(0.5, 0.5).setScale(1.0).setDepth(5);
    this.pipe = pipe;
    // Trigger zone
    const zone = this.add.zone(x, y - 30, 80, 80);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player ? this.player : { sprite: null }, zone, () => {});
    pipe.zone = zone;
  }

  spawnFlag(x, y) {
    // Place the pole standing on the ground row
    const groundY = (this.physics.world.bounds.height) - TILE; // top of ground row
    const pole = this.add.image(x + 30, groundY, 'flagpole').setOrigin(0.5, 1);
    pole.x = x + 30;
    pole.y = groundY;
    this.flagpole = pole;
    // Flag starts near the bottom of the pole
    const flag = this.add.image(pole.x + 28, pole.y - 30, 'flag').setOrigin(0, 0.5);
    this.flagSprite = flag;
    // Goal zone — overlaps the bottom 200px of the pole
    const zone = this.add.zone(pole.x, pole.y - 140, 90, 280);
    this.physics.add.existing(zone, true);
    this.flagZone = zone;
  }

  update(_t, dt) {
    if (!this.player) return;
    const dts = dt / 1000;
    const speed = this.segment === 'water' ? PHYSICS.swimSpeed : PHYSICS.playerSpeed;

    // Horizontal movement
    if (this.keys.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.facing = 'left';
    } else if (this.keys.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.facing = 'right';
    } else {
      this.player.setVelocityX(0);
    }
    // Vertical swim
    if (this.segment === 'water') {
      if (this.keys.up.isDown) this.player.setVelocityY(-PHYSICS.swimSpeed);
      else if (this.keys.down.isDown) this.player.setVelocityY(PHYSICS.swimSpeed);
      else this.player.setVelocityY(this.player.body.velocity.y * 0.95);
    }

    // Enemy AI
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      if (e.kind === 'snake') {
        if (e.body.blocked.left) e.setVelocityX(50);
        if (e.body.blocked.right) e.setVelocityX(-50);
      }
      if (e.kind === 'tiger') {
        if (e.body.blocked.left) e.setVelocityX(40);
        if (e.body.blocked.right) e.setVelocityX(-40);
      }
      if (e.kind === 'shark') {
        e.y = e.baseY + Math.sin(this.time.now / 400) * 30;
        if (e.x < 0 || e.x > this.physics.world.bounds.right) e.setVelocityX(-e.body.velocity.x);
      }
      if (e.kind === 'jellyfish') {
        if (e.y < e.baseY - 60) e.setVelocityY(40);
        if (e.y > e.baseY + 60) e.setVelocityY(-40);
      }
      if (e.kind === 'fish') {
        e.y = e.baseY + Math.sin(this.time.now / 500 + e.x * 0.01) * 12;
        if (e.x < 0) e.setVelocityX(40);
        if (e.x > this.physics.world.bounds.right) e.setVelocityX(-40);
      }
    });

    // Pipe trigger — enter the pipe by pressing down while overlapping
    if (this.pipe && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.pipe.x, this.pipe.y) < 50) {
      if (this.keys.down.isDown || this.keys.up.isDown || true /* auto-enter */) {
        this.advanceSegment();
      }
    }

    // Flag overlap — start the flag hoist
    if (this.flagZone && !this.goalReached) {
      const b = this.flagZone.body;
      const px = this.player.x, py = this.player.y;
      if (px > b.x && px < b.x + b.width && py > b.y && py < b.y + b.height) {
        this.goalReached = true;
        this.startFlagHoist();
      }
    }

    // Death from falling out of world
    if (this.player.y > this.physics.world.bounds.bottom + 100) {
      this.respawn();
    }
  }

  jumpOrSwim() {
    if (this.segment === 'water') return; // swim handled in update
    if (this.player.body.blocked.down || this.player.body.touching.down) {
      this.player.setVelocityY(PHYSICS.jumpVelocity);
      SFX.jump();
    }
  }

  shootArrow() {
    if (!this.player) return;
    if (this.charDef.isPet) {
      this.biteAttack();
      return;
    }
    const now = this.time.now;
    if (now - this.player.lastShoot < 250) return;
    this.player.lastShoot = now;
    const dir = this.player.facing === 'left' ? -1 : 1;
    const arrow = this.activeArrows.create(this.player.x + dir * 40, this.player.y - 10, `arrow_${this.arrowDef.id}`);
    arrow.body.setAllowGravity(this.segment !== 'water');
    arrow.setVelocityX(dir * 700);
    if (this.segment === 'water') arrow.setVelocityY(0);
    arrow.setFlipX(dir < 0);
    SFX.shoot();
    // auto-destroy after 2s
    this.time.delayedCall(2000, () => arrow.active && arrow.destroy());
  }

  biteAttack() {
    // Benji bites in front
    const dir = this.player.facing === 'left' ? -1 : 1;
    const bite = this.add.rectangle(this.player.x + dir * 50, this.player.y, 40, 30, 0xff5a5f, 0.4).setDepth(100);
    SFX.bite();
    this.physics.add.existing(bite);
    bite.body.setAllowGravity(false);
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      if (Phaser.Math.Distance.Between(bite.x, bite.y, e.x, e.y) < 50) {
        this.arrowHitEnemy(bite, e);
      }
    });
    this.time.delayedCall(150, () => bite.destroy());
  }

  collectCoin(coin) {
    if (!coin.active) return;
    coin.destroy();
    SFX.coin();
    const state = this.registry.get('gameState');
    state.money += coin.value || 1;
    this.hud.setMoney(state.money);
  }

  arrowHitEnemy(arrow, enemy) {
    if (!enemy.active) return;
    if (enemy.kind === 'jellyfish') {
      // Jellyfish can't be shot — arrow bounces / dies
      if (arrow.destroy) arrow.destroy();
      return;
    }
    if (arrow.destroy) arrow.destroy();
    if (enemy.kind === 'fish') {
      // Fish gives money/food
      const state = this.registry.get('gameState');
      state.money += enemy.value || 3;
      this.hud.setMoney(state.money);
      const t = this.add.text(enemy.x, enemy.y - 20, `+$${enemy.value || 3}`, {
        fontFamily: 'Fredoka', fontSize: '22px', fontStyle: '700',
        color: '#ffe066', stroke: '#3a1f5e', strokeThickness: 4,
      }).setOrigin(0.5);
      this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    }
    SFX.hit();
    // Death animation
    this.tweens.add({ targets: enemy, alpha: 0, scaleX: 0, scaleY: 0, duration: 200, onComplete: () => enemy.destroy() });
  }

  playerHitEnemy(enemy) {
    if (!enemy.active) return;
    if (this.time.now < this.player.invincibleUntil) return;
    // Snakes can be jumped over: if we're moving downward and above the snake top, just bounce
    if (enemy.kind === 'snake' && this.player.body.velocity.y > 0 && this.player.y < enemy.y - 10) {
      // Stomp! Snake dies, player bounces
      enemy.destroy();
      this.player.setVelocityY(-380);
      SFX.hit();
      return;
    }
    this.takeDamage();
  }

  takeDamage() {
    this.hearts -= 1;
    this.hud.setHearts(Math.max(0, this.hearts));
    SFX.damage();
    this.player.invincibleUntil = this.time.now + 1200;
    // flash
    this.tweens.add({
      targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 5,
      onComplete: () => this.player.setAlpha(1),
    });
    // knockback
    const dir = this.player.facing === 'left' ? 1 : -1;
    this.player.setVelocityX(dir * 200);
    this.player.setVelocityY(-250);
    if (this.hearts <= 0) this.respawn();
  }

  respawn() {
    this.hearts = 3;
    this.hud.setHearts(this.hearts);
    this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
    this.player.setVelocity(0, 0);
  }

  advanceSegment() {
    if (this._transitioning) return;
    this._transitioning = true;
    SFX.splash();
    const next = this.segment === 'land' ? 'water' : 'final';
    // fade
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.checkpoint = { segment: next, x: 120, y: 200 };
      this.buildSegment(next);
      this.cameras.main.fadeIn(400);
      this._transitioning = false;
    });
  }

  startFlagHoist() {
    SFX.victory();
    // Disable controls
    this.player.body.setVelocity(0, 0);
    this.player.body.setEnable(false);
    const targetY = this.flagpole.y - 240; // near the top of the pole
    this.tweens.add({
      targets: this.flagSprite, y: targetY, duration: 1800, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          const state = this.registry.get('gameState');
          save({ totalMoney: state.money });
          this.scene.start(SCENE_KEYS.Victory);
        });
      },
    });
  }
}
