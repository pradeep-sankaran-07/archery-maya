import Phaser from 'phaser';
import { SCENE_KEYS } from '../config.js';
import { load } from '../save.js';
import { setMuted } from '../art/audio.js';
import { migrateLocalEntriesOnce } from '../leaderboard.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.Boot); }

  create() {
    // Seed registry from save
    const data = load();
    this.registry.set('save', data);
    this.registry.set('gameState', {
      character: data.lastCharacter,
      bow: data.lastBow,
      arrow: data.lastArrow,
      money: 0,
      levelScores: {},
      cart: [],
      playerName: '',
    });
    setMuted(!!data.muted);
    // One-time: push this device's old local-only scores up to the shared
    // board. Fire-and-forget; no-ops after the first successful run.
    migrateLocalEntriesOnce();
    this.scene.start(SCENE_KEYS.Preload);
  }
}
