import * as THREE from 'three';
import {
  buildPlayer, animatePlayer, buildBall, BALL_R, blobShadow, heroRing, arrowMarker,
  buildCarpet, buildLamp, buildTopHat, lightBeam, buildGenie, buildGenieHand, buildTiger,
  buildElephant, buildCannon, buildBalloons, buildCircusNet,
} from '../three/models.js';
import { HL, HW, GOAL_HW, GOAL_H, GOAL_D, FENCE_X, FENCE_Z, BOX_D, BOX_HW, GRAVITY } from './constants.js';
import { SFX } from '../audio.js';
import { t } from '../i18n.js';
import { COINS } from '../data.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const tmp = V(), tmp2 = V();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const flat = (v) => Math.hypot(v.x, v.z);
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const HERO_SPEED = 6.6;
const HERO_SPEED_BALL = 5.7;

/**
 * One football match. Owns all players, the ball and the match-only 3D props.
 * The app gives it a scene, camera helpers, input, and an event callback.
 */
export class Match {
  constructor(opts) {
    this.opts = opts;
    this.scene = opts.scene;
    this.fx = opts.particles;
    this.theme = opts.theme;
    this.role = opts.role; // 'striker' | 'goalie'
    this.input = opts.input;
    this.emit = opts.onEvent || (() => {});
    this.teams = opts.teams; // [{name, kit, players:[char...] (gk first)}]
    this.duration = opts.duration;
    this.timeLeft = opts.duration;
    this.score = [0, 0];
    this.scorers = []; // {charId, team, kind}
    this.coins = 0;
    this.stats = { heroGoals: 0, saves: 0, headers: 0, volleys: 0, supers: 0 };
    this.time = 0;
    this.state = 'kickoff';
    this.stateT = 0;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.power = null;        // 'carpet' | 'cannon' | 'genie' | 'net' when held
    this.powerActive = null;  // { kind, t }
    this.item = null;         // magic item on pitch
    this.itemTimer = 18;
    this.rescueUsed = false;
    this.animal = null;
    this.skyCooldown = 8;
    this.toastCooldown = {};
    this.tips = { header: false, sky: false };
    this.shotPreview = null;
    this.firstMatch = !!opts.firstMatch;
    this.cutscene = null;
    this.paused = false;

    this.buildPlayers();
    this.buildBall();
    this.buildProps();
    this.resetKickoff(this.role === 'goalie' ? 1 : 0, true);
  }

  // ── Setup ─────────────────────────────────────────────────────────────
  buildPlayers() {
    this.players = [];
    this.teams.forEach((team, ti) => {
      team.players.forEach((char, idx) => {
        const role = idx === 0 ? 'gk' : 'field';
        const model = buildPlayer(char, team.kit, { goalie: role === 'gk' });
        const shadow = blobShadow(model.isDog ? 1.0 : 1.2);
        this.group.add(model.root, shadow);
        const human = ti === 0 && ((this.role === 'goalie' && role === 'gk') || (this.role === 'striker' && idx === 1));
        const p = {
          char, team: ti, role, idx, human, model, shadow,
          pos: V(), vel: V(), face: ti === 0 ? Math.PI / 2 : -Math.PI / 2,
          anim: { speed: 0, kickT: 0, headerT: 0, diveT: 0, diveSide: 1, celebrate: 0, sad: 0, jumpY: 0, flee: 0, dizzy: 0, throwT: 0, holding: false, ready: false, flying: false },
          noTouch: 0, protect: 0, tackle: 0, flee: 0, windup: 0, holdT: 0, dribbleT: 0, passCool: 0,
          flyY: 0, gkSave: null, height: model.height,
        };
        this.players.push(p);
      });
    });
    this.hero = this.players.find((p) => p.human);
    this.ring = heroRing();
    this.group.add(this.ring);
    this.emit('players', this.players);
  }

  buildBall() {
    this.ball = {
      mesh: buildBall(), shadow: blobShadow(0.6),
      pos: V(), vel: V(), owner: null, lastTouch: null, kick: null, inNet: 0, spinAxis: V(1, 0, 0),
      intended: null, intendedT: 0,
    };
    this.group.add(this.ball.mesh, this.ball.shadow);
    this.trail = 0;
  }

  buildProps() {
    this.goalArrow = arrowMarker();
    this.goalArrow.position.set(HL + 0.5, 4, 0);
    this.group.add(this.goalArrow);
    this.carpet = buildCarpet(); this.carpet.visible = false; this.group.add(this.carpet);
    this.balloons = buildBalloons(); this.balloons.visible = false; this.group.add(this.balloons);
    this.cannon = buildCannon(); this.cannon.visible = false; this.group.add(this.cannon);
    this.trampoline = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 20), new THREE.MeshToonMaterial({ color: 0x1e88e5 }));
    tr.position.y = 0.35;
    const trRim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 6, 20), new THREE.MeshToonMaterial({ color: 0xff5a5f }));
    trRim.rotation.x = Math.PI / 2; trRim.position.y = 0.4;
    this.trampoline.add(tr, trRim);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), new THREE.MeshToonMaterial({ color: 0x444444 }));
      const a = i * Math.PI / 2 + 0.7;
      leg.position.set(Math.cos(a) * 0.8, 0.2, Math.sin(a) * 0.8);
      this.trampoline.add(leg);
    }
    this.trampoline.visible = false; this.group.add(this.trampoline);
    this.genie = buildGenie(); this.genie.visible = false; this.group.add(this.genie);
    this.genieHands = [buildGenieHand(), buildGenieHand()];
    this.genieHands.forEach((h) => { h.visible = false; this.group.add(h); });
    this.circusNet = buildCircusNet(); this.circusNet.visible = false; this.group.add(this.circusNet);
    this.target = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.55, 28),
      new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.target.rotation.y = Math.PI / 2;
    this.target.visible = false;
    this.group.add(this.target);
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => { if (o.geometry && !o.geometry.parameters?.shared) { /* geometries shared; let GC handle */ } });
  }

  // ── Kickoff ───────────────────────────────────────────────────────────
  resetKickoff(teamWithBall, first = false) {
    const b = this.ball;
    b.owner = null; b.inNet = 0; b.kick = null; b.intended = null;
    b.vel.set(0, 0, 0);
    b.pos.set(0, BALL_R, 0);
    for (const p of this.players) {
      p.vel.set(0, 0, 0);
      p.noTouch = 0; p.protect = 0; p.tackle = 0; p.flee = 0; p.windup = 0; p.holdT = 0; p.gkSave = null;
      p.flyY = 0; p.anim.celebrate = 0; p.anim.sad = 0; p.anim.diveT = 0; p.anim.flying = false; p.anim.dizzy = 0;
      const s = p.team === 0 ? -1 : 1;
      if (p.role === 'gk') p.pos.set(s * (HL - 0.8), 0, 0);
      else if (p.idx === 1) p.pos.set(s * 5, 0, -3.5);
      else p.pos.set(s * 7, 0, 4);
      p.face = p.team === 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    const kicker = this.players.find((p) => p.team === teamWithBall && p.role === 'field' && (teamWithBall === 0 && this.role === 'striker' ? p.human : p.idx === 1));
    kicker.pos.set(teamWithBall === 0 ? -0.7 : 0.7, 0, 0);
    b.owner = kicker;
    kicker.protect = 1.5;
    this.state = 'kickoff';
    this.stateT = first ? 2.2 : 1.4;
    this.emit('banner', { big: t('banner.ready'), small: '', ms: first ? 1200 : 800 });
    this.powerActive = null;
    this.hideRide();
  }

  // ── Main update ───────────────────────────────────────────────────────
  update(dt) {
    if (this.paused) return;
    this.time += dt;
    this.stateT -= dt;

    if (this.state === 'kickoff') {
      if (this.stateT <= 0) {
        this.state = 'play';
        SFX.whistle();
        this.emit('banner', { big: t('banner.go'), small: '', ms: 700 });
        if (this.firstMatch && !this.saidGo) {
          this.saidGo = true;
          this.emit('toast', this.role === 'goalie' ? t('toast.goGoalie', { name: this.hero.char.name }) : t('toast.go', { name: this.hero.char.name }));
          this.emit('hints');
        }
      }
      this.placeOwnedBall();
      this.updateButtons();
    } else if (this.state === 'play') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.endMatch();
      } else {
        this.updatePlay(dt);
      }
    } else if (this.state === 'goal') {
      this.updateBallPhysics(dt);
      this.updateCelebrate(dt);
      if (this.stateT <= 0) this.resetKickoff(this.lastGoalTeam === 0 ? 1 : 0);
    } else if (this.state === 'ended') {
      this.updateCelebrate(dt);
    }

    this.updateAnimal(dt);
    this.updateVisuals(dt);
  }

  updatePlay(dt) {
    for (const p of this.players) {
      p.noTouch = Math.max(0, p.noTouch - dt);
      p.protect = Math.max(0, p.protect - dt);
      p.passCool = Math.max(0, p.passCool - dt);
      p.tackleCool = Math.max(0, (p.tackleCool || 0) - dt);
      p.flee = Math.max(0, p.flee - dt);
      p.anim.kickT = Math.max(0, p.anim.kickT - dt);
      p.anim.headerT = Math.max(0, p.anim.headerT - dt);
      p.anim.throwT = Math.max(0, p.anim.throwT - dt);
      p.anim.dizzy = Math.max(0, p.anim.dizzy - dt);
      if (p.anim.diveT > 0) p.anim.diveT = Math.max(0, p.anim.diveT - dt);
    }
    this.skyCooldown -= dt;
    this.ball.intendedT = Math.max(0, this.ball.intendedT - dt);
    if (this.ball.intendedT <= 0) this.ball.intended = null;

    this.updateHero(dt);
    for (const p of this.players) if (!p.human) this.updateAI(p, dt);
    this.movePlayers(dt);
    this.updateBallPhysics(dt);
    this.updatePossession(dt);
    this.updateItem(dt);
    this.updatePowerActive(dt);
    this.maybeRescue(dt);
    this.updateButtons();
  }

  // ── Hero control ──────────────────────────────────────────────────────
  worldMove() {
    const m = this.input.move();
    const f = this.opts.camForward(); // ground-projected camera forward
    const r = tmp2.set(-f.z, 0, f.x);
    return tmp.set(r.x * m.x - f.x * m.y, 0, r.z * m.x - f.z * m.y);
  }

  updateHero(dt) {
    const h = this.hero;
    const mv = this.worldMove();
    const ride = this.powerActive && (this.powerActive.kind === 'carpet' || this.powerActive.kind === 'cannon') ? this.powerActive : null;
    let speed = this.ball.owner === h ? HERO_SPEED_BALL : HERO_SPEED;
    if (ride) speed = 9;
    if (h.role === 'gk') speed = 6.2;
    if (this.cutscene) {
      this.input.take('kick'); this.input.take('pass');
      return;
    }
    const want = V().copy(mv).multiplyScalar(speed);
    if (h.role === 'gk' && h.anim.diveT > 0) want.set(0, 0, h.anim.diveT > 0.3 ? clamp((h.diveTarget - h.pos.z) * 12, -8, 8) : 0);
    const k = 1 - Math.exp(-dt * 14);
    h.vel.lerp(want, k);

    const kick = this.input.take('kick');
    const pass = this.input.take('pass');
    const power = this.input.take('power');

    if (power && this.power) this.usePower();

    if (h.role === 'gk') {
      this.heroGoalieActions(kick, pass);
      return;
    }

    const b = this.ball;
    if (kick) {
      if (ride && b.owner === h) {
        this.superShot(h);
      } else if (b.owner === h) {
        this.shoot(h, 'shot');
      } else {
        const ctx = this.kickContext();
        if (ctx === 'header') this.doHeader(h);
        else if (ctx === 'sky') this.doSkyVolley(h);
        else if (ctx === 'loose') this.shoot(h, 'first');
        else if (ctx === 'tackle') { this.trySteal(h, true); }
      }
    }
    if (pass && b.owner === h) {
      const mate = this.players.find((p) => p.team === 0 && p.role === 'field' && !p.human);
      if (mate) this.pass(h, mate, 'ground');
    }
  }

  /** What would KICK do right now (when hero doesn't own the ball)? */
  kickContext() {
    const h = this.hero, b = this.ball;
    if (b.owner === h) return 'shot';
    if (h.noTouch > 0 || h.anim.headerT > 0 || this.cutscene) return null;
    if (b.owner && b.owner.team === 1 && h.tackleCool > 0) return null;
    if (b.owner && b.owner.team === 1 && dist2(b.owner.pos, h.pos) < 1.6) return 'tackle';
    if (b.owner) return null;
    const d = dist2(b.pos, h.pos);
    if (b.pos.y > 2.6 && b.kick && b.kick.type === 'sky' && d < 10) return 'sky';
    if (b.pos.y > 0.95 && b.pos.y < 3.0 && d < 2.6) return 'header';
    if (b.pos.y <= 0.95 && d < 1.7) return 'loose';
    return null;
  }

  heroGoalieActions(kick, pass) {
    const h = this.hero, b = this.ball;
    if (b.owner === h) {
      h.anim.holding = true;
      h.holdT += 1 / 60;
      if (kick || pass || h.holdT > 6) this.gkDistribute(h);
      return;
    }
    h.anim.holding = false;
    if (kick && h.anim.diveT <= 0) {
      // Dive toward where the ball is going (kid-friendly auto-aim).
      let tz;
      if (!b.owner && b.vel.x < -3 && b.pos.x > h.pos.x) {
        const tt = (h.pos.x - b.pos.x) / b.vel.x;
        tz = b.pos.z + b.vel.z * tt;
      } else if (this.shotPreview) tz = this.shotPreview.z;
      else {
        const mv = this.worldMove();
        tz = h.pos.z + (Math.sign(mv.z) || Math.sign(b.pos.z - h.pos.z) || 1) * 1.5;
      }
      const dz = clamp(tz - h.pos.z, -2.4, 2.4);
      const side = Math.sign(dz) || 1;
      h.diveTarget = h.pos.z + dz;
      h.anim.diveT = 0.7;
      h.anim.diveSide = -side; // team 0 faces +X, so local +X is world -Z
      h.diveDir = side;
      SFX.whoosh();
    }
  }

  // ── AI ────────────────────────────────────────────────────────────────
  updateAI(p, dt) {
    const b = this.ball;
    let target = null;
    let speed = 5;
    const own = b.owner;
    const attackDir = p.team === 0 ? 1 : -1;
    const goalX = attackDir * HL;
    const ownGoalX = -goalX;
    const striker = this.role === 'striker';

    if (p.flee > 0 && this.animal) {
      const away = V().subVectors(p.pos, this.animal.pos); away.y = 0;
      if (away.lengthSq() < 0.01) away.set(0, 0, 1);
      away.normalize().multiplyScalar(7);
      p.vel.lerp(away, 1 - Math.exp(-dt * 8));
      p.anim.flee = p.flee;
      return;
    }
    p.anim.flee = 0;

    if (p.role === 'gk') { this.updateKeeper(p, dt); return; }

    if (own === p) {
      // Carrying the ball
      p.dribbleT += dt;
      if (p.team === 0) {
        // Teammate: run forward a bit then give it to the hero.
        if (striker) {
          const h = this.hero;
          speed = 5.4;
          target = V(clamp(p.pos.x + 6, -HL + 4, HL - 9), 0, p.pos.z * 0.9);
          const hold = p.holdFor ?? (p.holdFor = rand(0.5, 1.0));
          const heroFree = h && !h.anim.flying;
          if (p.dribbleT > hold && heroFree && p.passCool <= 0) {
            p.holdFor = null;
            this.teammatePassToHero(p);
            return;
          }
        } else {
          // Goalie mode: AI teammates attack and shoot themselves.
          speed = 5.6;
          target = V(goalX - attackDir * 9, 0, clamp(p.pos.z * 0.6, -6, 6));
          const mate = this.players.find((q) => q.team === p.team && q.role === 'field' && q !== p);
          const dGoal = Math.abs(goalX - p.pos.x);
          if (dGoal < 13 && Math.abs(p.pos.z) < 9) { this.aiShoot(p); return; }
          if (mate && p.dribbleT > 1.6 && p.passCool <= 0 && Math.random() < dt * 1.2) { this.pass(p, mate, 'ground'); return; }
        }
      } else {
        // Opponent attacking our goal
        speed = striker ? 5.3 : 5.0;
        if (p.windup > 0) {
          p.windup -= dt;
          p.vel.multiplyScalar(0.8);
          if (p.windup <= 0) this.aiShoot(p);
          return;
        }
        target = V(goalX - attackDir * 8, 0, clamp(p.pos.z * 0.7 + Math.sin(this.time * 0.9 + p.idx) * 4, -7, 7));
        // Dribble around defenders instead of running straight into them.
        const dir = V().subVectors(target, p.pos); dir.y = 0; dir.normalize();
        for (const q of this.players) {
          if (q.team === p.team || q.role === 'gk') continue;
          const away = V().subVectors(p.pos, q.pos); away.y = 0;
          const d = away.length();
          if (d < 3.5 && d > 0.01) dir.addScaledVector(away.normalize(), (3.5 - d) / 3.5 * 1.6);
        }
        dir.normalize();
        target.copy(p.pos).addScaledVector(dir, 3);
        const dGoal = Math.abs(goalX - p.pos.x);
        const shootRange = striker ? 18 : 14;
        if (dGoal < shootRange && Math.abs(p.pos.z) < 9 && p.dribbleT > 0.6) {
          p.windup = this.role === 'goalie' ? 0.75 : 0.45;
          if (this.role === 'goalie') this.prepareShotPreview(p);
          return;
        }
        const pressure = this.players.some((q) => q.team !== p.team && q.role === 'field' && dist2(q.pos, p.pos) < 2.6);
        const mate = this.players.find((q) => q.team === p.team && q.role === 'field' && q !== p);
        const mateFree = mate && !this.players.some((q) => q.team !== p.team && q.role === 'field' && dist2(q.pos, mate.pos) < 2.5);
        if (pressure && mateFree && p.dribbleT > 0.3 && p.passCool <= 0 && Math.random() < dt * 3) { this.pass(p, mate, 'ground'); return; }
      }
    } else if (!own || own.role === 'gk') {
      // Loose ball (or a keeper holding it): nearest player of each team chases.
      const mates = this.players.filter((q) => q.team === p.team && q.role === 'field');
      const myD = this.ballChaseDist(p);
      const closest = mates.every((q) => q === p || this.ballChaseDist(q) >= myD - 0.01 || (q.human && false));
      const heroIsMate = p.team === 0 && striker;
      let chase = closest;
      if (heroIsMate) {
        // Let the hero go for it if they're reasonably close.
        const hd = this.ballChaseDist(this.hero);
        chase = myD < hd - 3;
      }
      if (b.intended === p) chase = true;
      if (b.intended && b.intended !== p && b.intended.team === p.team) chase = false;
      if (own && own.role === 'gk') chase = false;
      if (chase) {
        target = this.interceptPoint(p);
        speed = p.team === 0 ? 6.0 : (striker ? 5.7 : 5.6);
      } else {
        target = this.supportSpot(p);
        speed = 4.5;
      }
    } else if (own.team === p.team) {
      // Teammate has the ball: get into a good spot.
      target = this.supportSpot(p);
      speed = 5.2;
    } else {
      // Defending: one presses, the other covers.
      const mates = this.players.filter((q) => q.team === p.team && q.role === 'field');
      const presser = mates.reduce((a, q) => (dist2(q.pos, own.pos) < dist2(a.pos, own.pos) ? q : a), mates[0]);
      if (p.team === 0 && striker) {
        // AI teammate helps win the ball back for the hero (but not too fast)
        target = V().copy(own.pos);
        speed = 4.9;
      } else if (presser === p) {
        target = V().copy(own.pos).addScaledVector(own.vel, 0.3);
        speed = p.team === 1 ? (striker ? 5.6 : 5.4) : 5.4;
      } else {
        // Cover: stand on the line between the ball and our goal.
        const k = 0.45;
        target = V(ownGoalX + (own.pos.x - ownGoalX) * k, 0, own.pos.z * k);
        if (Math.abs(target.x - ownGoalX) < 3.5) target.x = ownGoalX - Math.sign(ownGoalX) * 3.5;
        speed = p.team === 1 ? 5.0 : 4.6;
      }
    }

    if (target) {
      target.x = clamp(target.x, -HL + 0.5, HL - 0.5);
      target.z = clamp(target.z, -HW + 0.5, HW - 0.5);
      const d = V().subVectors(target, p.pos); d.y = 0;
      const len = d.length();
      const arrive = Math.min(1, len / 1.2);
      if (len > 0.05) d.multiplyScalar((speed * arrive) / len); else d.set(0, 0, 0);
      p.vel.lerp(d, 1 - Math.exp(-dt * 7));
    }
  }

  ballChaseDist(p) {
    return dist2(p.pos, this.ball.pos) + (this.ball.pos.y > 2 ? 2 : 0);
  }

  interceptPoint(p) {
    const b = this.ball;
    // Look ahead along the ball's roll a little
    const look = clamp(flat(b.vel) / 10, 0, 0.8);
    return V(b.pos.x + b.vel.x * look, 0, b.pos.z + b.vel.z * look);
  }

  supportSpot(p) {
    const b = this.ball;
    const dir = p.team === 0 ? 1 : -1;
    if (p.team === 0 && this.role === 'striker') {
      const h = this.hero;
      // Stay wide of the hero, a little ahead, ready to receive and give back.
      const side = h.pos.z > 0 ? -1 : 1;
      return V(clamp(h.pos.x + 4, -HL + 6, HL - 6), 0, clamp(h.pos.z + side * 7, -HW + 2, HW - 2));
    }
    const own = b.owner;
    const base = own ? own.pos : b.pos;
    return V(clamp(base.x + dir * 6, -HL + 5, HL - 5), 0, clamp(-base.z * 0.6 + (p.idx === 1 ? -4 : 4), -HW + 2, HW - 2));
  }

  updateKeeper(p, dt) {
    const b = this.ball;
    const s = p.team === 0 ? -1 : 1; // own goal side
    const lineX = s * (HL - 0.7);
    if (b.owner === p) {
      p.anim.holding = true;
      p.holdT += dt;
      p.vel.multiplyScalar(0.85);
      if (p.holdT > 0.9) this.gkDistribute(p);
      return;
    }
    p.anim.holding = false;
    if (p.gkSave) {
      const g = p.gkSave;
      g.t += dt;
      if (g.t > g.react) {
        const dz = g.targetZ - p.pos.z;
        const sp = g.willSave ? Math.max(4, Math.abs(dz) / Math.max(0.12, g.arrive - g.t)) : 5;
        p.vel.set(0, 0, clamp(dz * 8, -sp, sp));
        if (!g.dived && (Math.abs(dz) > 0.8 || !g.willSave) && g.arrive - g.t < 0.35) {
          g.dived = true;
          p.anim.diveT = 0.7;
          p.anim.diveSide = Math.sign(g.targetZ - p.pos.z || 1) * (p.team === 0 ? -1 : 1);
        }
      } else p.vel.multiplyScalar(0.7);
      if (g.t > g.arrive + 0.6) p.gkSave = null;
      return;
    }
    // Track the ball along the line, come off it a little when the ball is close.
    const near = Math.abs(b.pos.x - s * HL) < 14;
    const tz = clamp(b.pos.z * 0.35, -GOAL_HW + 0.5, GOAL_HW - 0.5);
    const tx = near ? lineX - s * 0.6 : lineX;
    const d = V(tx - p.pos.x, 0, tz - p.pos.z);
    const len = d.length();
    if (len > 0.05) d.multiplyScalar(Math.min(4, len * 4) / len);
    p.vel.lerp(d, 1 - Math.exp(-dt * 6));
    p.anim.ready = near;
    // Pick up a slow ball in the box.
    if (!b.owner && b.pos.y < 2 && flat(b.vel) < 6 && dist2(b.pos, p.pos) < 1.1 && p.noTouch <= 0) {
      this.gkCatch(p);
    }
  }

  // ── Movement + collisions ─────────────────────────────────────────────
  movePlayers(dt) {
    for (const p of this.players) {
      p.pos.addScaledVector(p.vel, dt);
      // keepers stay near their goal
      if (p.role === 'gk') {
        const s = p.team === 0 ? -1 : 1;
        if (p.human) {
          p.pos.x = clamp(p.pos.x, s < 0 ? -HL + 0.2 : HL - BOX_D, s < 0 ? -HL + BOX_D : HL - 0.2);
          p.pos.z = clamp(p.pos.z, -BOX_HW, BOX_HW);
        } else {
          p.pos.x = s < 0 ? clamp(p.pos.x, -HL + 0.3, -HL + 3) : clamp(p.pos.x, HL - 3, HL - 0.3);
          p.pos.z = clamp(p.pos.z, -GOAL_HW - 1.2, GOAL_HW + 1.2);
        }
      } else {
        p.pos.x = clamp(p.pos.x, -FENCE_X + 0.4, FENCE_X - 0.4);
        p.pos.z = clamp(p.pos.z, -FENCE_Z + 0.4, FENCE_Z - 0.4);
        // keep out of the nets
        for (const s of [-1, 1]) {
          if (p.pos.x * s > HL - 0.2 && Math.abs(p.pos.z) < GOAL_HW + 0.3) {
            if (p.pos.x * s < HL + 0.3) p.pos.x = s * (HL - 0.2);
            else p.pos.z = Math.sign(p.pos.z || 1) * (GOAL_HW + 0.3);
          }
        }
      }
      const sp = flat(p.vel);
      if (sp > 0.4 && !(p.role === 'gk' && p.anim.diveT > 0)) {
        const want = Math.atan2(p.vel.x, p.vel.z);
        let d = want - p.face;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        p.face += d * Math.min(1, dt * 12);
      } else if (p.role === 'gk' || (this.ball.owner !== p && sp < 0.4)) {
        // idle players look at the ball
        const want = Math.atan2(this.ball.pos.x - p.pos.x, this.ball.pos.z - p.pos.z);
        let d = want - p.face;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        p.face += d * Math.min(1, dt * 5);
      }
      p.anim.speed = sp;
    }
    // separation
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], c = this.players[j];
        if (a.anim.flying || c.anim.flying) continue;
        const dx = c.pos.x - a.pos.x, dz = c.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz);
        const min = 0.75;
        if (d > 0.001 && d < min) {
          const push = (min - d) / 2;
          const nx = dx / d, nz = dz / d;
          const wa = a.human ? 0.6 : 1, wc = c.human ? 0.6 : 1;
          a.pos.x -= nx * push * wa; a.pos.z -= nz * push * wa;
          c.pos.x += nx * push * wc; c.pos.z += nz * push * wc;
        }
      }
    }
  }

  placeOwnedBall() {
    const b = this.ball, o = b.owner;
    if (!o) return;
    if (o.anim.holding) {
      // in hands
      const fx = Math.sin(o.face), fz = Math.cos(o.face);
      b.pos.set(o.pos.x + fx * 0.35, (o.model.headY || 1.2) * 0.75 + o.flyY, o.pos.z + fz * 0.35);
      b.vel.copy(o.vel);
      return;
    }
    const fx = Math.sin(o.face), fz = Math.cos(o.face);
    const lead = 0.5 + (o.model.isDog ? 0.15 : 0) + Math.sin(this.time * 10) * 0.05 * Math.min(1, flat(o.vel) / 4);
    b.pos.set(o.pos.x + fx * lead, BALL_R + o.flyY, o.pos.z + fz * lead);
    b.vel.copy(o.vel);
  }

  updateBallPhysics(dt) {
    const b = this.ball;
    if (b.owner) { this.placeOwnedBall(); return; }
    const prev = tmp.copy(b.pos);
    b.vel.y -= GRAVITY * dt;
    b.pos.addScaledVector(b.vel, dt);
    if (b.pos.y < BALL_R) {
      b.pos.y = BALL_R;
      if (b.vel.y < -1.5) { b.vel.y = -b.vel.y * 0.55; if (b.vel.y > 2) SFX.bounce(); }
      else b.vel.y = 0;
      const f = Math.exp(-dt * 1.1);
      b.vel.x *= f; b.vel.z *= f;
      if (flat(b.vel) < 0.08) { b.vel.x = 0; b.vel.z = 0; }
    } else {
      const f = Math.exp(-dt * 0.08);
      b.vel.x *= f; b.vel.z *= f;
    }
    if (b.kick && b.kick.curve) {
      // gentle magic curve toward the target for super shots
      const k = b.kick;
      const to = V(k.tx - b.pos.x, k.ty - b.pos.y, k.tz - b.pos.z);
      if (to.length() > 0.5) {
        const sp = b.vel.length();
        b.vel.lerp(to.normalize().multiplyScalar(sp), Math.min(1, dt * 6));
      }
    }
    this.goalCheck(prev);
    this.ballWalls();
    this.ballFrame();
    this.keeperIntercept();
  }

  goalCheck(prev) {
    const b = this.ball;
    if (b.inNet) {
      this.netContain(b.inNet);
      return;
    }
    for (const s of [-1, 1]) {
      const crossed = prev.x * s < HL + 0.05 && b.pos.x * s >= HL + 0.05;
      if (!crossed) continue;
      if (Math.abs(b.pos.z) < GOAL_HW - BALL_R * 0.5 && b.pos.y < GOAL_H - BALL_R * 0.5) {
        b.inNet = s;
        if (this.state === 'play') this.goalScored(s > 0 ? 0 : 1);
        return;
      }
    }
  }

  netContain(s) {
    const b = this.ball;
    const backX = s * (HL + GOAL_D - BALL_R);
    if (b.pos.x * s > backX * s) { b.pos.x = backX; b.vel.x *= -0.15; b.vel.z *= 0.5; b.vel.y *= 0.5; }
    if (Math.abs(b.pos.z) > GOAL_HW - BALL_R) { b.pos.z = Math.sign(b.pos.z) * (GOAL_HW - BALL_R); b.vel.z *= -0.2; }
    if (b.pos.y > GOAL_H - BALL_R) { b.pos.y = GOAL_H - BALL_R; b.vel.y *= -0.2; }
    if (b.pos.x * s < HL + BALL_R) { b.pos.x = s * (HL + BALL_R); b.vel.x = Math.abs(b.vel.x) * s * 0.2; }
  }

  ballWalls() {
    const b = this.ball;
    if (b.inNet) return;
    const ex = FENCE_X - BALL_R, ez = FENCE_Z - BALL_R;
    if (Math.abs(b.pos.x) > ex) { b.pos.x = Math.sign(b.pos.x) * ex; b.vel.x *= -0.6; SFX.bounce(); this.missed(); }
    if (Math.abs(b.pos.z) > ez) { b.pos.z = Math.sign(b.pos.z) * ez; b.vel.z *= -0.6; SFX.bounce(); }
    if (b.pos.y > 9) { b.pos.y = 9; b.vel.y = -Math.abs(b.vel.y) * 0.5; }
    // outside of the net boxes: push the ball out
    for (const s of [-1, 1]) {
      const lx = b.pos.x * s - HL;
      if (lx > -BALL_R && lx < GOAL_D + BALL_R && Math.abs(b.pos.z) < GOAL_HW + BALL_R && b.pos.y < GOAL_H + BALL_R) {
        // where are we relative to the box?
        const penSide = GOAL_HW + BALL_R - Math.abs(b.pos.z);
        const penTop = GOAL_H + BALL_R - b.pos.y;
        const penBack = GOAL_D + BALL_R - lx;
        const penFront = lx + BALL_R;
        if (lx < 0.06 && Math.abs(b.pos.z) < GOAL_HW - BALL_R * 0.5 && b.pos.y < GOAL_H - BALL_R * 0.5) continue; // in the goal mouth (handled by goalCheck)
        const m = Math.min(penSide, penTop, penBack);
        if (m === penTop && b.vel.y <= 0) { b.pos.y = GOAL_H + BALL_R; b.vel.y = Math.abs(b.vel.y) * 0.3; b.vel.x *= 0.7; }
        else if (m === penSide) { b.pos.z = Math.sign(b.pos.z) * (GOAL_HW + BALL_R); b.vel.z = Math.sign(b.pos.z) * Math.abs(b.vel.z) * 0.3; }
        else if (m === penBack) { b.pos.x = s * (HL + GOAL_D + BALL_R); b.vel.x = s * Math.abs(b.vel.x) * 0.3; }
        void penFront;
      }
    }
  }

  ballFrame() {
    const b = this.ball;
    const r = BALL_R + 0.07;
    for (const s of [-1, 1]) {
      const gx = s * HL;
      // posts
      for (const pz of [-GOAL_HW, GOAL_HW]) {
        if (b.pos.y > GOAL_H + r) continue;
        const dx = b.pos.x - gx, dz = b.pos.z - pz;
        const d = Math.hypot(dx, dz);
        if (d < r && d > 0.0001) {
          const nx = dx / d, nz = dz / d;
          const vn = b.vel.x * nx + b.vel.z * nz;
          if (vn < 0) { b.vel.x -= 1.7 * vn * nx; b.vel.z -= 1.7 * vn * nz; this.postHit(); }
          b.pos.x = gx + nx * r; b.pos.z = pz + nz * r;
        }
      }
      // crossbar
      if (Math.abs(b.pos.z) < GOAL_HW) {
        const dx = b.pos.x - gx, dy = b.pos.y - GOAL_H;
        const d = Math.hypot(dx, dy);
        if (d < r && d > 0.0001) {
          const nx = dx / d, ny = dy / d;
          const vn = b.vel.x * nx + b.vel.y * ny;
          if (vn < 0) { b.vel.x -= 1.7 * vn * nx; b.vel.y -= 1.7 * vn * ny; this.postHit(); }
          b.pos.x = gx + nx * r; b.pos.y = GOAL_H + ny * r;
        }
      }
    }
  }

  postHit() {
    if (this.time - (this.lastPost || -9) < 0.5) return;
    this.lastPost = this.time;
    SFX.post();
    SFX.ooh();
    if (this.ball.kick) this.ball.kick.done = true;
    this.toast(t('toast.post'), 'post');
  }

  missed() {
    const k = this.ball.kick;
    if (!k || k.done || !k.shot) return;
    k.done = true;
    if (Math.abs(this.ball.pos.x) > HL) {
      SFX.ooh();
      if (k.by && k.by.human) this.toast(t('toast.miss'), 'miss');
    }
  }

  /** Keepers catch shots their save-decision says they reach. */
  keeperIntercept() {
    const b = this.ball;
    if (b.owner || b.inNet) return;
    for (const p of this.players) {
      if (p.role !== 'gk') continue;
      const s = p.team === 0 ? -1 : 1;
      const comingIn = b.vel.x * s > 2;
      if (!comingIn) continue;
      const dx = Math.abs(b.pos.x - p.pos.x);
      if (p.human ? dx > 0.6 : (b.pos.x - p.pos.x) * s < -0.4) continue;
      if (p.human) {
        // Real hands: reach depends on standing or diving.
        const reach = p.anim.diveT > 0 ? 1.4 : 0.85;
        const maxH = p.anim.diveT > 0 ? 2.1 : 2.4;
        const genie = this.powerActive && (this.powerActive.kind === 'genie' || this.powerActive.kind === 'net');
        if ((Math.abs(b.pos.z - p.pos.z) < reach && b.pos.y < maxH) || (genie && Math.abs(b.pos.z) < GOAL_HW + 0.5)) {
          if (genie && Math.abs(b.pos.z - p.pos.z) >= reach) this.magicBlock(p);
          else this.gkCatch(p, true);
          return;
        }
      } else if (p.gkSave && p.gkSave.willSave) {
        // The save was decided when the shot was struck: make sure it happens.
        if (b.pos.y < 2.6) {
          p.pos.z = THREE.MathUtils.clamp(b.pos.z, p.pos.z - 1.6, p.pos.z + 1.6);
          if (Math.random() < 0.15) this.gkParry(p); else this.gkCatch(p, true);
          return;
        }
      }
    }
  }

  // ── Possession ────────────────────────────────────────────────────────
  updatePossession(dt) {
    const b = this.ball;
    if (b.owner) {
      const o = b.owner;
      if (o.role === 'gk' && o.anim.holding) return;
      // Tackles: opponents close to the carrier for a while steal it.
      for (const p of this.players) {
        if (p.team === o.team || p.role === 'gk' || p.flee > 0 || p.noTouch > 0) continue;
        if (o.anim.flying) continue;
        const d = dist2(p.pos, o.pos);
        if (d < 1.0) {
          p.tackle += dt;
          let need = 0.4;
          if (o.human) need = this.role === 'striker' ? 0.6 : 0.45;
          else if (p.human) need = 0.7;
          else if (p.team === 0) need = this.role === 'striker' ? 0.9 : 0.6;
          else need = 0.55;
          if (p.tackle >= need && o.protect <= 0) {
            this.changeOwner(p);
            o.noTouch = 0.6;
            SFX.pass();
            if (o.human) this.toast(t('toast.stolen'), 'stolen', 6);
            p.tackle = 0;
          }
        } else p.tackle = Math.max(0, p.tackle - dt * 2);
      }
      return;
    }
    if (b.inNet || this.state !== 'play') return;
    // Free ball: who can control it?
    let best = null, bestD = 99;
    const speed = b.vel.length();
    for (const p of this.players) {
      if (p.noTouch > 0 || p.role === 'gk' || p.flee > 0) continue;
      if (p.anim.flying) continue;
      const d = dist2(p.pos, b.pos);
      let r = p.human ? 1.05 : 0.75;
      if (b.intended === p) r = p.human ? 1.6 : 1.1;
      const maxY = p.human ? 1.0 : 0.8;
      if (d > r || b.pos.y > maxY) continue;
      if (speed > 15 && b.intended !== p) continue;
      if (p.team === 1 && b.intended && b.intended.team === 0 && speed > 7) continue;
      if (d < bestD) { best = p; bestD = d; }
    }
    if (best) {
      this.changeOwner(best);
      SFX.catchBall();
    }
  }

  changeOwner(p) {
    const b = this.ball;
    const prev = b.owner;
    b.owner = p;
    b.kick = null;
    b.intended = null;
    b.lastTouch = p;
    p.protect = p.human ? 0.9 : 0.6;
    p.dribbleT = 0;
    p.holdT = 0;
    p.holdFor = null;
    if (prev && prev !== p) prev.tackle = 0;
  }

  trySteal(h) {
    const o = this.ball.owner;
    if (!o || o.team === h.team) return;
    if (dist2(o.pos, h.pos) < 1.6) {
      // lunge
      h.anim.kickT = 0.3;
      h.tackleCool = 0.8;
      if (o.role !== 'gk' && Math.random() < 0.45) {
        this.changeOwner(h);
        o.noTouch = 0.8;
        o.anim.dizzy = 0.6;
        SFX.kick(0.6);
      }
    }
  }

  // ── Kicks ─────────────────────────────────────────────────────────────
  release(p, cooldown = 0.35) {
    const b = this.ball;
    b.owner = null;
    b.lastTouch = p;
    p.noTouch = cooldown;
    p.anim.holding = false;
  }

  /** Hero shot ('shot' | 'first') or AI shot. Decides goal/save right away. */
  shoot(p, kind) {
    const b = this.ball;
    const attack = p.team === 0 ? 1 : -1;
    const gx = attack * HL;
    const keeper = this.players.find((q) => q.team !== p.team && q.role === 'gk');
    const d = Math.hypot(gx - b.pos.x, b.pos.z);
    // Aim: joystick up/down picks a side, else away from the keeper.
    let side;
    if (p.human) {
      const mv = this.worldMove();
      side = Math.abs(mv.z) > 0.35 ? Math.sign(mv.z) : -Math.sign(keeper.pos.z || (Math.random() - 0.5));
    } else side = Math.random() < 0.5 ? -1 : 1;
    let tz = side * rand(0.8, 1.8);
    let ty = rand(0.25, 1.4);
    // Inaccuracy grows with distance and sharp angles.
    const angle = Math.abs(Math.atan2(b.pos.z, Math.abs(gx - b.pos.x)));
    const err = 0.15 + d * 0.03 + angle * 0.4;
    tz += (Math.random() + Math.random() - 1) * err;
    ty += (Math.random() - 0.4) * err * 0.4;
    ty = Math.max(0.2, ty);
    if (p.plannedAim) {
      // goalie mode: shoot where the warning circle showed
      tz = p.plannedAim.goalZ + (Math.random() - 0.5) * 0.3;
      ty = p.plannedAim.y;
      p.plannedAim = null;
    }

    let speed = kind === 'first' ? 18 : 19.5;
    if (!p.human) speed = this.role === 'goalie' && p.team === 1 ? rand(14, 17) : rand(14, 17);
    if (d > 26) speed *= 0.85;

    const onTarget = Math.abs(tz) < GOAL_HW - 0.15 && ty < GOAL_H - 0.15;
    let pGoal;
    if (p.team === 0) {
      pGoal = d < 9 ? 0.5 : d < 15 ? 0.38 : d < 22 ? 0.24 : 0.1;
      pGoal *= 1 - Math.min(0.4, angle * 0.4);
      if (kind === 'first') pGoal *= 0.95;
      if (!p.human) pGoal = 0.5;
    } else {
      pGoal = 0.5;
    }
    this.launchShot(p, kind, { tx: gx + attack * 0.6, ty, tz, speed, pGoal, onTarget, keeper });
  }

  launchShot(p, kind, { tx, ty, tz, speed, pGoal, onTarget, keeper, curve = false }) {
    const b = this.ball;
    this.release(p);
    if (b.pos.y < BALL_R + 0.05) b.pos.y = BALL_R + 0.05;
    const dx = tx - b.pos.x, dz = tz - b.pos.z;
    const dh = Math.hypot(dx, dz);
    const tFly = dh / speed;
    const vy = (ty - b.pos.y + 0.5 * GRAVITY * tFly * tFly) / tFly;
    b.vel.set(dx / tFly, vy, dz / tFly);
    b.kick = { type: kind, by: p, shot: true, done: false, tx, ty, tz, curve };
    p.anim.kickT = kind === 'header' || kind === 'volley' ? 0 : 0.3;
    SFX.kick(kind === 'super' ? 1.3 : 1);
    if (kind === 'super') SFX.superShot();

    // Keeper decision
    if (keeper && !keeper.human) {
      const s = keeper.team === 0 ? -1 : 1;
      const lineX = s * HL;
      const tCross = Math.abs((lineX - b.pos.x) / (b.vel.x || 0.001));
      const zCross = b.pos.z + b.vel.z * tCross;
      const willSave = onTarget && Math.random() > pGoal;
      const aimZ = willSave ? zCross : (Math.abs(zCross - keeper.pos.z) < 1.6 ? keeper.pos.z - Math.sign(zCross - keeper.pos.z || 1) * 1.6 : keeper.pos.z + (zCross - keeper.pos.z) * 0.3);
      keeper.gkSave = { t: 0, react: willSave ? 0.08 : rand(0.15, 0.3), arrive: tCross * 0.85, targetZ: clamp(aimZ, -GOAL_HW - 0.8, GOAL_HW + 0.8), willSave, dived: false };
      if (kind === 'super') { keeper.gkSave.willSave = false; keeper.gkSave.targetZ = -Math.sign(tz) * 2.2; }
    }
    if (keeper && keeper.human && !this.shotPreview) this.prepareShotPreview(p, { tz, ty });
  }

  doHeader(h) {
    const b = this.ball;
    // step toward the ball (a little magnetic help)
    h.pos.x += (b.pos.x - h.pos.x) * 0.5;
    h.pos.z += (b.pos.z - h.pos.z) * 0.5;
    h.anim.headerT = 0.45;
    SFX.header();
    const gx = HL;
    const d = Math.hypot(gx - b.pos.x, b.pos.z);
    const keeper = this.players.find((q) => q.team === 1 && q.role === 'gk');
    const side = -Math.sign(keeper.pos.z || (Math.random() - 0.5));
    const tz = side * rand(0.9, 2.0) + (Math.random() - 0.5) * (0.3 + d * 0.04);
    const ty = rand(0.2, 1.4);
    const pGoal = d < 10 ? 0.52 : d < 16 ? 0.4 : 0.25;
    this.ball.owner = null;
    this.launchShot(h, 'header', { tx: gx + 0.6, ty, tz, speed: 14, pGoal, onTarget: Math.abs(tz) < GOAL_HW - 0.15, keeper });
  }

  doSkyVolley(h) {
    // Carpet / trampoline flies the hero up to meet the ball, then volley!
    const b = this.ball;
    const tMeet = 0.65;
    const meet = V(b.pos.x + b.vel.x * tMeet, Math.max(2.4, b.pos.y + b.vel.y * tMeet - 0.5 * GRAVITY * tMeet * tMeet), b.pos.z + b.vel.z * tMeet);
    meet.x = clamp(meet.x, -HL + 1, HL - 1);
    meet.z = clamp(meet.z, -HW + 1, HW - 1);
    meet.y = clamp(meet.y, 2.4, 5.5);
    this.cutscene = { kind: 'volley', t: 0, dur: tMeet, from: h.pos.clone(), meet, ballFrom: b.pos.clone(), ballVel: b.vel.clone() };
    b.owner = null;
    h.anim.flying = this.theme !== 'circus';
    if (this.theme === 'circus') {
      this.trampoline.visible = true;
      this.trampoline.position.set(h.pos.x, 0, h.pos.z);
      SFX.pop();
    } else {
      this.carpet.visible = true;
      SFX.whoosh();
    }
    b.kick = { type: 'skyHeld', done: true };
    // freeze ball path; we'll move it to the meet point
  }

  updateCutscene(dt) {
    const c = this.cutscene;
    if (!c) return;
    c.t += dt;
    const h = this.hero, b = this.ball;
    if (c.kind === 'volley') {
      const k = Math.min(1, c.t / c.dur);
      const e = k * k * (3 - 2 * k);
      h.pos.x = c.from.x + (c.meet.x - c.from.x) * e;
      h.pos.z = c.from.z + (c.meet.z - c.from.z) * e;
      h.flyY = (c.meet.y - 1.0) * Math.sin(e * Math.PI / 2);
      h.vel.set(0, 0, 0);
      b.pos.lerpVectors(c.ballFrom, c.meet, e);
      b.vel.set(0, 0, 0);
      if (this.theme === 'circus') { h.anim.jumpY = 0; h.model.inner.rotation.x = -e * Math.PI * 2; }
      if (k >= 1 && !c.kicked) {
        c.kicked = true;
        b.pos.copy(c.meet);
        const keeper = this.players.find((q) => q.team === 1 && q.role === 'gk');
        const d = Math.hypot(HL - b.pos.x, b.pos.z);
        const side = -Math.sign(keeper.pos.z || (Math.random() - 0.5));
        const tz = side * rand(1.0, 2.0) + (Math.random() - 0.5) * 0.3;
        h.anim.kickT = 0.3;
        this.launchShot(h, 'volley', { tx: HL + 0.6, ty: rand(0.4, 1.6), tz, speed: 21, pGoal: d < 18 ? 0.68 : 0.5, onTarget: true, keeper });
        this.stats.volleys++;
        this.cutscene = { kind: 'land', t: 0, dur: 0.8, fromY: h.flyY };
      }
    } else if (c.kind === 'land') {
      const k = Math.min(1, c.t / c.dur);
      h.flyY = c.fromY * (1 - k);
      if (this.theme === 'circus') h.model.inner.rotation.x = 0;
      if (k >= 1) {
        h.flyY = 0; h.anim.flying = false;
        this.carpet.visible = false; this.trampoline.visible = false;
        this.cutscene = null;
      }
    } else if (c.kind === 'launch') {
      // cannon launch into a hover
      const k = Math.min(1, c.t / c.dur);
      h.flyY = Math.sin(k * Math.PI / 2) * 2.4;
      h.pos.x += 7 * dt; h.vel.set(7, 0, 0);
      if (k >= 1) { this.cutscene = null; }
    }
  }

  superShot(h) {
    const keeper = this.players.find((q) => q.team === 1 && q.role === 'gk');
    const side = -Math.sign(keeper.pos.z || (Math.random() - 0.5));
    const tz = side * 1.6;
    this.launchShot(h, 'super', { tx: HL + 0.8, ty: 1.0, tz, speed: 24, pGoal: 1, onTarget: true, keeper, curve: true });
    this.stats.supers++;
    // end the ride after the shot
    this.powerActive.t = Math.min(this.powerActive.t, 0.9);
  }

  aiShoot(p) {
    p.windup = 0;
    this.shoot(p, 'ai');
    if (p.team === 1) this.emit('shot');
  }

  /** Ground pass / cross / sky ball. */
  pass(from, to, type) {
    const b = this.ball;
    this.release(from, 0.4);
    from.passCool = 1.0;
    from.anim.kickT = 0.3;
    let target;
    if (type === 'ground') {
      const lead = to.human ? 0.45 : 0.3;
      target = V(to.pos.x + to.vel.x * lead, 0, to.pos.z + to.vel.z * lead);
    } else {
      target = type.target;
    }
    const dx = target.x - b.pos.x, dz = target.z - b.pos.z;
    const dh = Math.max(0.5, Math.hypot(dx, dz));
    let tFly, vy;
    const kind = typeof type === 'string' ? type : type.kind;
    if (kind === 'ground') {
      const sp = clamp(dh * 1.3 + 4, 7, 15);
      tFly = dh / sp;
      vy = 0.6;
      b.pos.y = BALL_R + 0.02;
      SFX.pass();
    } else if (kind === 'cross') {
      tFly = clamp(dh / 12, 0.7, 1.4);
      const arriveY = 1.55;
      vy = (arriveY - b.pos.y + 0.5 * GRAVITY * tFly * tFly) / tFly;
      SFX.kick(0.7);
    } else { // sky
      tFly = 2.1;
      const arriveY = 1.0;
      vy = (arriveY - b.pos.y + 0.5 * GRAVITY * tFly * tFly) / tFly;
      SFX.kick(0.8);
    }
    b.vel.set(dx / tFly, vy, dz / tFly);
    b.kick = { type: kind, by: from, shot: false, done: false };
    b.intended = to;
    b.intendedT = tFly + 1.2;
  }

  teammatePassToHero(p) {
    const h = this.hero;
    const toGoal = HL - h.pos.x;
    const r = Math.random();
    // Sky ball: Maya's flying-carpet idea. Not too often, and only from midfield-ish.
    if (this.skyCooldown <= 0 && toGoal < 30 && toGoal > 8 && r < (this.tips.sky ? 0.25 : 0.5)) {
      this.skyCooldown = 18;
      const target = V(clamp(h.pos.x + 3, -HL + 4, HL - 6), 0, clamp(h.pos.z * 0.7, -8, 8));
      this.pass(p, h, { kind: 'sky', target });
      if (!this.tips.sky || Math.random() < 0.5) {
        this.tips.sky = true;
        this.toast(this.theme === 'circus' ? t('toast.skyBallCircus') : t('toast.skyBall'), 'sky', 0);
      }
      return;
    }
    if (toGoal < 18 && Math.abs(h.pos.z) < 9 && r < 0.6) {
      // cross to the hero's head, in front of goal
      const target = V(clamp(h.pos.x + h.vel.x * 0.5, HL - 14, HL - 4), 0, clamp(h.pos.z + h.vel.z * 0.5, -5, 5));
      this.pass(p, h, { kind: 'cross', target });
      if (!this.tips.header) { this.tips.header = true; this.toast(t('toast.header'), 'header', 0); }
      return;
    }
    this.pass(p, h, 'ground');
    if (Math.random() < 0.3) this.toast(t('toast.passBack', { name: p.char.name }), 'passBack', 8);
  }

  // ── Keepers ───────────────────────────────────────────────────────────
  gkCatch(p, fromShot = false) {
    const b = this.ball;
    b.owner = p;
    b.kick = null;
    b.intended = null;
    b.vel.set(0, 0, 0);
    p.anim.holding = true;
    p.holdT = 0;
    p.gkSave = null;
    SFX.catchBall();
    this.hideShotPreview();
    if (fromShot) {
      SFX.save();
      if (p.human) {
        this.stats.saves++;
        this.addCoins(COINS.save, p);
        this.toast(t('toast.save'), 'save', 0);
        SFX.cheer();
        this.opts.stadium.crowd.userData.cheer();
      } else if (p.team === 1) {
        this.toast(t('toast.saved'), 'saved', 3);
        SFX.groan();
      }
    }
  }

  gkParry(p) {
    const b = this.ball;
    const s = p.team === 0 ? 1 : -1;
    b.vel.set(s * rand(2, 4), rand(4, 6), (Math.random() < 0.5 ? -1 : 1) * rand(7, 10));
    b.kick = null;
    p.noTouch = 0.6;
    p.gkSave = null;
    SFX.save();
    if (p.team === 1) { this.toast(t('toast.saved'), 'saved', 3); SFX.groan(); }
  }

  magicBlock(p) {
    const b = this.ball;
    b.vel.set(rand(5, 8), rand(2, 4), (Math.random() - 0.5) * 6);
    b.kick = null;
    SFX.sparkle(); SFX.save();
    const pos = b.pos;
    this.fx.sparkle(pos.x, pos.y, pos.z, 0x80d8ff, 20);
    this.stats.saves++;
    this.addCoins(COINS.save, p);
    this.toast(t('toast.save'), 'save', 0);
    this.hideShotPreview();
  }

  gkDistribute(p) {
    const mates = this.players.filter((q) => q.team === p.team && q.role === 'field');
    let to;
    if (p.team === 0 && this.role === 'striker') to = this.hero;
    else {
      // the teammate with the most space (furthest from any opponent)
      const space = (q) => Math.min(...this.players.filter((o) => o.team !== p.team && o.role !== 'gk').map((o) => dist2(o.pos, q.pos)));
      to = mates.reduce((a, q) => (space(q) > space(a) ? q : a), mates[0]);
    }
    p.anim.throwT = 0.4;
    p.anim.holding = false;
    this.release(p, 0.8);
    const b = this.ball;
    b.pos.y = Math.max(b.pos.y, 1.0);
    this.pass(p, to, 'ground');
    p.holdT = 0;
  }

  prepareShotPreview(shooter, aim) {
    // Show where the next shot will cross our goal line (goalie mode).
    if (this.role !== 'goalie') return;
    const goalZ = aim ? aim.tz : rand(-1.9, 1.9);
    const ty = aim ? aim.ty : rand(0.5, 1.5);
    // Where the ball will pass the keeper's usual spot (1 m off the line).
    const from = shooter ? shooter.pos : this.ball.pos;
    const gx = -HL - 0.6, kx = -HL + 1;
    const k = (kx - from.x) / (gx - from.x);
    const lineZ = from.z + (goalZ - from.z) * clamp(k, 0, 1);
    this.shotPreview = { z: lineZ, goalZ, y: clamp(ty, 0.4, 1.8), t: 1.8 };
    this.target.visible = true;
    this.target.position.set(kx, this.shotPreview.y, lineZ);
    if (!this.tips.watch) { this.tips.watch = true; this.toast(t('toast.watch'), 'watch', 0); }
    if (shooter && shooter.windup > 0) shooter.plannedAim = this.shotPreview;
  }
  hideShotPreview() { this.shotPreview = null; this.target.visible = false; }

  // ── Goals ─────────────────────────────────────────────────────────────
  goalScored(team) {
    const b = this.ball;
    const kick = b.kick;
    const by = kick && kick.by ? kick.by : b.lastTouch;
    this.score[team]++;
    this.lastGoalTeam = team;
    this.state = 'goal';
    this.stateT = 3.6;
    this.hideShotPreview();
    SFX.whistle();
    const own = by && by.team !== team;
    const scorer = own ? null : by;
    this.scorers.push({ charId: scorer ? scorer.char.id : null, team, kind: kick ? kick.type : 'shot' });
    this.lastScorer = scorer;
    const isSuper = kick && kick.type === 'super';
    if (team === 0) {
      SFX.cheer(); SFX.goalJingle(this.theme);
      this.opts.stadium.crowd.userData.cheer();
      if (scorer && scorer.human) {
        let c = COINS.goal;
        if (kick && kick.type === 'header') { c += COINS.headerBonus; this.stats.headers++; }
        if (kick && kick.type === 'volley') c += COINS.volleyBonus;
        if (isSuper) c += COINS.superBonus;
        this.stats.heroGoals++;
        this.addCoins(c, scorer);
      } else {
        this.addCoins(COINS.teamGoal, this.hero);
      }
      const name = scorer ? scorer.char.name : t('own');
      this.emit('banner', { big: isSuper ? t('banner.superGoal') : t('banner.goal'), small: t('banner.scored', { name }), ms: 3000 });
      for (let i = 0; i < 3; i++) setTimeout(() => this.fx.firework(HL + rand(-1, 3), rand(5, 9), rand(-6, 6)), i * 350);
      this.fx.confetti(HL - 1, 2, 0, 160);
      if (this.theme === 'aladdin') this.showGenie(true);
      for (const p of this.players) { if (p.team === 0) p.anim.celebrate = 0.01; else p.anim.sad = 3; }
    } else {
      SFX.sad();
      this.emit('banner', { big: t('banner.ohNo'), small: t('banner.keepGoing'), ms: 2600, sad: true });
      for (const p of this.players) { if (p.team === 1) p.anim.celebrate = 0.01; }
    }
    this.emit('score', { score: this.score.slice() });
  }

  updateCelebrate(dt) {
    for (const p of this.players) {
      if (p.anim.celebrate > 0) p.anim.celebrate += dt;
      if (p.anim.sad > 0) p.anim.sad -= dt;
      // players drift toward the scorer
      if (this.state === 'goal' && this.lastScorer && p.team === this.lastGoalTeam && p !== this.lastScorer && p.role === 'field') {
        const d = V().subVectors(this.lastScorer.pos, p.pos); d.y = 0;
        if (d.length() > 1.2) p.pos.addScaledVector(d.normalize(), dt * 3.5);
      }
      p.vel.multiplyScalar(0.9);
      p.anim.speed = 0;
      p.anim.diveT = Math.max(0, p.anim.diveT - dt);
    }
    if (this.genie.visible) {
      this.genie.position.y = Math.min(1.5, this.genie.position.y + dt * 3);
      this.genie.rotation.y = Math.sin(this.time * 2) * 0.3 - Math.PI / 2;
    }
  }

  showGenie(on) {
    this.genie.visible = on;
    if (on) {
      this.genie.position.set(HL + 4, -3, 0);
      this.genie.scale.setScalar(1.6);
      SFX.sparkle();
    }
  }

  endMatch() {
    this.state = 'ended';
    SFX.whistle(true);
    this.input.setEnabled(false);
    this.hideRide();
    this.hideShotPreview();
    const [a, c] = this.score;
    for (const p of this.players) {
      if ((a > c && p.team === 0) || (c > a && p.team === 1)) p.anim.celebrate = 0.01;
      else if (a !== c) p.anim.sad = 5;
    }
    if (a > c) this.addCoins(COINS.win, this.hero);
    else if (a === c) this.addCoins(COINS.draw, this.hero);
    this.emit('banner', { big: t('banner.fullTime'), small: `${a} – ${c}`, ms: 2600 });
    setTimeout(() => this.emit('ended', this.result()), 2800);
  }

  result() {
    return { score: this.score.slice(), scorers: this.scorers.slice(), coins: this.coins, stats: { ...this.stats } };
  }

  addCoins(n, p) {
    this.coins += n;
    SFX.coin();
    this.emit('coins', { total: this.coins, add: n, at: p ? p.pos.clone().setY(p.height + 0.6) : null });
  }

  toast(msg, key, cooldown = 4) {
    const now = this.time;
    if (key && this.toastCooldown[key] && now < this.toastCooldown[key]) return;
    if (key) this.toastCooldown[key] = now + Math.max(cooldown, 2.5);
    this.emit('toast', msg);
  }

  // ── Magic items + powers ──────────────────────────────────────────────
  updateItem(dt) {
    if (this.power || this.powerActive) return;
    if (!this.item) {
      this.itemTimer -= dt;
      if (this.itemTimer <= 0 && this.timeLeft > 12) this.spawnItem();
      return;
    }
    const it = this.item;
    it.mesh.rotation.y += dt * 2;
    it.mesh.position.y = 0.6 + Math.sin(this.time * 3) * 0.2;
    if (Math.random() < 0.3) this.fx.sparkle(it.pos.x, 0.9, it.pos.z, 0xffe066, 1);
    if (dist2(this.hero.pos, it.pos) < 1.4) {
      this.group.remove(it.mesh);
      this.group.remove(it.beam);
      this.item = null;
      this.emit('itemLabel', null);
      const goalie = this.role === 'goalie';
      this.power = goalie ? (this.theme === 'circus' ? 'net' : 'genie') : (this.theme === 'circus' ? 'cannon' : 'carpet');
      SFX.power();
      this.fx.sparkle(it.pos.x, 1, it.pos.z, 0xffe066, 30);
      this.toast(t('toast.powerReady'), 'power', 0);
    }
  }

  spawnItem() {
    const goalie = this.role === 'goalie';
    const mesh = this.theme === 'circus' ? buildTopHat() : buildLamp();
    const beam = lightBeam(this.theme === 'circus' ? 0xff9ad5 : 0xfff2a0);
    let x, z;
    if (goalie) { x = -HL + rand(2.5, 5); z = rand(-4, 4); }
    else {
      const h = this.hero.pos;
      x = clamp(h.x + rand(4, 10), -HL + 8, HL - 8);
      z = clamp(h.z + rand(-6, 6), -HW + 3, HW - 3);
    }
    mesh.position.set(x, 0.6, z);
    beam.position.set(x, 6, z);
    this.group.add(mesh, beam);
    this.item = { mesh, beam, pos: V(x, 0, z) };
    this.itemTimer = 32;
    SFX.sparkle();
    const key = this.theme === 'circus' ? (goalie ? 'toast.hatGoalie' : 'toast.hat') : (goalie ? 'toast.lampGoalie' : 'toast.lamp');
    this.toast(t(key), 'item', 0);
    this.emit('itemLabel', { pos: V(x, 2.2, z), text: this.theme === 'circus' ? '🎩' : '🪔' });
  }

  usePower() {
    const kind = this.power;
    this.power = null;
    const h = this.hero, b = this.ball;
    SFX.power();
    if (kind === 'carpet' || kind === 'cannon') {
      // Ball magically flies to you
      if (b.owner !== h) {
        if (b.owner) b.owner.noTouch = 1.5;
        this.changeOwner(h);
        this.fx.sparkle(b.pos.x, b.pos.y, b.pos.z, 0xffe066, 20);
      }
      h.anim.flying = true;
      this.powerActive = { kind, t: 7.5 };
      if (kind === 'carpet') {
        this.carpet.visible = true;
        this.toast(t('toast.carpetRide'), 'ride', 0);
        SFX.whoosh();
      } else {
        this.cannon.visible = true;
        this.cannon.position.set(h.pos.x - 1.2, 0, h.pos.z);
        this.cannon.rotation.y = Math.PI / 2 - 0.8 + 0.8;
        this.cannonT = 1.5;
        SFX.boom();
        this.fx.smoke(h.pos.x, 1.5, h.pos.z, 30);
        this.balloons.visible = true;
        this.toast(t('toast.cannon'), 'ride', 0);
        this.cutscene = { kind: 'launch', t: 0, dur: 0.5 };
      }
      // scare opponents a bit
      for (const p of this.players) if (p.team === 1 && p.role === 'field') { p.anim.dizzy = 1.5; }
    } else if (kind === 'genie') {
      this.powerActive = { kind, t: 12 };
      this.showGenie(true);
      this.genie.position.set(-HL - 4, 0, 0);
      this.genie.scale.setScalar(1.8);
      this.genieHands.forEach((hand) => { hand.visible = true; });
      this.toast(t('toast.genie'), 'gpow', 0);
    } else if (kind === 'net') {
      this.powerActive = { kind, t: 12 };
      this.circusNet.visible = true;
      this.circusNet.position.set(-HL - 0.05, 0, 0);
      SFX.trumpet();
      this.toast(t('toast.net'), 'gpow', 0);
    }
  }

  updatePowerActive(dt) {
    const pa = this.powerActive;
    if (!pa) return;
    pa.t -= dt;
    const h = this.hero;
    if (pa.kind === 'carpet' || pa.kind === 'cannon') {
      if (!this.cutscene) h.flyY += (2.4 - h.flyY) * Math.min(1, dt * 3);
      if (this.ball.owner !== h && !this.ball.kick) {
        // lost the ball somehow: give it back (nobody can catch you!)
        if (!this.ball.inNet && pa.t > 1) this.changeOwner(h);
      }
      if (pa.t <= 0) {
        this.powerActive = null;
        this.landRide();
      }
    } else if (pa.kind === 'genie') {
      const b = this.ball;
      this.genieHands.forEach((hand, i) => {
        const s = i === 0 ? -1 : 1;
        const tz = clamp(b.pos.z + s * 1.1, -GOAL_HW - 0.5, GOAL_HW + 0.5);
        hand.position.set(-HL - 0.2, 1.1, hand.position.z + (tz - hand.position.z) * Math.min(1, dt * 6));
        hand.rotation.y = Math.PI / 2;
      });
      this.genie.position.y = Math.sin(this.time * 2) * 0.2;
      if (pa.t <= 0) { this.powerActive = null; this.showGenie(false); this.genieHands.forEach((hh) => { hh.visible = false; }); }
    } else if (pa.kind === 'net') {
      this.circusNet.rotation.x = Math.sin(this.time * 4) * 0.02;
      if (pa.t <= 0) { this.powerActive = null; this.circusNet.visible = false; }
    }
  }

  landRide() {
    const h = this.hero;
    h.anim.flying = false;
    this.cutscene = { kind: 'land', t: 0, dur: 0.6, fromY: h.flyY };
    this.balloons.visible = false;
  }

  hideRide() {
    if (!this.hero) return;
    this.hero.flyY = 0;
    this.hero.anim.flying = false;
    this.carpet.visible = false;
    this.balloons.visible = false;
    this.cannon.visible = false;
    this.trampoline.visible = false;
    this.genieHands.forEach((hh) => { hh.visible = false; });
    this.circusNet.visible = false;
    if (this.genie) this.genie.visible = false;
    this.cutscene = null;
    if (this.hero.model) this.hero.model.inner.rotation.x = 0;
  }

  // ── Rajah / elephant rescue ───────────────────────────────────────────
  maybeRescue(dt) {
    if (this.rescueUsed || this.animal) return;
    const o = this.ball.owner;
    if (!o || o.team !== 1 || o.role === 'gk') return;
    if (this.duration - this.timeLeft < 15) return;
    if (o.pos.x > -6) return;
    if (Math.random() > dt * 0.8) return;
    this.rescueUsed = true;
    const circus = this.theme === 'circus';
    const mesh = circus ? buildElephant() : buildTiger();
    const side = o.pos.z > 0 ? -1 : 1;
    const start = V(o.pos.x - 2, 0, side * (FENCE_Z + 4));
    const end = V(o.pos.x + 4, 0, -side * (FENCE_Z + 6));
    mesh.position.copy(start);
    mesh.rotation.y = Math.atan2(end.x - start.x, end.z - start.z);
    this.group.add(mesh);
    this.animal = { mesh, pos: mesh.position, start, end, t: 0, dur: circus ? 3.4 : 2.6, phase: 0 };
    if (circus) SFX.trumpet(); else SFX.roar();
    this.toast(circus ? t('toast.elephant') : t('toast.rajah'), 'rescue', 0);
  }

  updateAnimal(dt) {
    const a = this.animal;
    if (!a) return;
    a.t += dt;
    const k = a.t / a.dur;
    a.pos.lerpVectors(a.start, a.end, k);
    a.phase += dt * 12;
    const legs = a.mesh.userData.legs || [];
    legs.forEach((l, i) => { l.rotation.x = Math.sin(a.phase + (i % 2 ? Math.PI : 0)) * 0.7; });
    if (a.mesh.userData.tail) a.mesh.userData.tail.rotation.z = Math.sin(a.phase * 0.5) * 0.5;
    a.mesh.position.y = Math.abs(Math.sin(a.phase)) * 0.12;
    // scare opponents near the animal
    for (const p of this.players) {
      if (p.team !== 1 || p.role === 'gk') continue;
      if (dist2(p.pos, a.pos) < 9) {
        if (p.flee <= 0) {
          p.flee = 2.5;
          if (this.ball.owner === p) {
            this.ball.owner = null;
            this.ball.vel.set(-2, 2, 0);
            p.noTouch = 2.5;
          }
        }
      }
    }
    if (Math.random() < 0.2) this.fx.spawn({ x: a.pos.x, y: 0.2, z: a.pos.z, vy: 1, life: 0.6, size: 0.4, grow: 0.6, g: 0, color: 0xd9c49a });
    if (a.t >= a.dur) {
      this.group.remove(a.mesh);
      this.animal = null;
    }
  }

  // ── Buttons ───────────────────────────────────────────────────────────
  updateButtons() {
    const h = this.hero;
    const inp = this.input;
    const keyKick = 'Space', keyPass = 'Shift', keyPow = 'E';
    if (h.role === 'gk') {
      const holding = this.ball.owner === h;
      inp.setButton('kick', holding ? { icon: '👐', label: t('btn.throw'), key: keyKick } : { icon: '🧤', label: t('btn.dive'), key: keyKick, cls: 'special' });
      inp.setButton('pass', { visible: false });
    } else {
      const ride = this.powerActive && (this.powerActive.kind === 'carpet' || this.powerActive.kind === 'cannon') && this.ball.owner === h;
      const ctx = this.kickContext();
      let cfg = { icon: '⚽', label: t('btn.kick'), key: keyKick };
      if (ride) cfg = { icon: '🌟', label: t('btn.super'), key: keyKick, cls: 'super' };
      else if (ctx === 'shot') cfg = { icon: '⚽', label: t('btn.shoot'), key: keyKick };
      else if (ctx === 'header') cfg = { icon: '🙆', label: t('btn.header'), key: keyKick, cls: 'special' };
      else if (ctx === 'sky') cfg = this.theme === 'circus' ? { icon: '🤸', label: t('btn.trampoline'), key: keyKick, cls: 'super' } : { icon: '🦜', label: t('btn.carpet'), key: keyKick, cls: 'super' };
      inp.setButton('kick', cfg);
      inp.setButton('pass', { icon: '👟', label: t('btn.pass'), key: keyPass, visible: this.ball.owner === h && !ride });
    }
    if (this.power) {
      const map = { carpet: ['🧞', t('btn.powerCarpet')], cannon: ['💥', t('btn.powerCannon')], genie: ['🧞', t('btn.powerGenie')], net: ['🎪', t('btn.powerNet')] };
      const [icon, label] = map[this.power];
      inp.setButton('power', { icon, label, key: keyPow });
    } else inp.setButton('power', { visible: false });
  }

  // ── Visual sync ───────────────────────────────────────────────────────
  updateVisuals(dt) {
    if (this.cutscene) this.updateCutscene(dt);
    for (const p of this.players) {
      const m = p.model;
      m.root.position.set(p.pos.x, p.flyY, p.pos.z);
      m.root.rotation.y = p.face;
      animatePlayer(m, p.anim, dt);
      p.shadow.position.set(p.pos.x, 0.02, p.pos.z);
      const sh = 1 / (1 + p.flyY * 0.4);
      p.shadow.scale.setScalar(sh);
    }
    const h = this.hero;
    this.ring.position.set(h.pos.x, 0.03, h.pos.z);
    const pulse = 1 + Math.sin(this.time * 6) * 0.08;
    this.ring.scale.setScalar(pulse);

    // ball
    const b = this.ball;
    b.mesh.position.copy(b.pos);
    const sp = flat(b.vel);
    if (sp > 0.05) {
      const axis = tmp.set(b.vel.z, 0, -b.vel.x).normalize();
      b.mesh.rotateOnWorldAxis(axis, (sp * dt) / BALL_R);
    }
    b.shadow.position.set(b.pos.x, 0.025, b.pos.z);
    b.shadow.scale.setScalar(1 / (1 + b.pos.y * 0.25));
    if (b.kick && b.kick.type === 'super' && !b.inNet) {
      const col = this.theme === 'circus' ? undefined : 0xffd54f;
      this.fx.sparkle(b.pos.x, b.pos.y, b.pos.z, col, 3);
    } else if (b.kick && (b.kick.type === 'sky' || b.kick.type === 'volley') && b.pos.y > 1) {
      if (Math.random() < 0.5) this.fx.sparkle(b.pos.x, b.pos.y, b.pos.z, 0x9be7ff, 1);
    }

    // goal arrow: show when the hero has the ball (striker)
    const showArrow = this.role === 'striker' && this.state === 'play' && b.owner === h && !this.powerActive;
    this.goalArrow.visible = showArrow;
    this.goalArrow.position.y = 3.6 + Math.sin(this.time * 5) * 0.3;
    this.goalArrow.rotation.y += dt * 2;

    // ride props
    if (this.carpet.visible) {
      this.carpet.position.set(h.pos.x, h.flyY + 0.05, h.pos.z);
      this.carpet.rotation.y = h.face;
      this.carpet.userData.wave(this.time);
      if (Math.random() < 0.6) this.fx.sparkle(h.pos.x - Math.sin(h.face), h.flyY, h.pos.z - Math.cos(h.face), 0xffe066, 1);
    }
    if (this.balloons.visible) {
      this.balloons.position.set(h.pos.x, h.flyY + h.height * 0.9, h.pos.z);
      this.balloons.rotation.y += dt;
    }
    if (this.cannon.visible) {
      this.cannonT -= dt;
      if (this.cannonT <= 0) this.cannon.visible = false;
    }
    if (this.target.visible && this.shotPreview) {
      const s = 1 + Math.sin(this.time * 12) * 0.15;
      this.target.scale.setScalar(s);
      this.shotPreview.t -= dt;
      if (this.shotPreview.t <= 0) this.hideShotPreview();
    }
  }

  /** Point the camera should follow. */
  focus() {
    const b = this.ball;
    if (this.state === 'goal' && this.lastScorer) return this.lastScorer.pos;
    if (this.role === 'goalie') {
      const h = this.hero;
      return V(b.pos.x * 0.75 + h.pos.x * 0.25, 0, b.pos.z * 0.75 + h.pos.z * 0.25);
    }
    return V(b.pos.x * 0.7 + this.hero.pos.x * 0.3, 0, b.pos.z * 0.7 + this.hero.pos.z * 0.3);
  }
}
