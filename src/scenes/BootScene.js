import Phaser from 'phaser';
import { SCENE_KEYS } from '../config.js';
import { load } from '../save.js';
import { setMuted } from '../art/audio.js';

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
    this.scene.start(SCENE_KEYS.Preload);
  }
}
