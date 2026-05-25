import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from './config.js';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import BowSelectScene from './scenes/BowSelectScene.js';
import HouseScene from './scenes/HouseScene.js';
import ArcheryRangeScene from './scenes/ArcheryRangeScene.js';
import GroceryScene from './scenes/GroceryScene.js';
import MovingArcheryScene from './scenes/MovingArcheryScene.js';
import AdventureScene from './scenes/AdventureScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import GiftShopScene from './scenes/GiftShopScene.js';
import PrizeShowcaseScene from './scenes/PrizeShowcaseScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
  backgroundColor: '#7ec8e3',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // DOM enabled so LeaderboardScene can overlay an HTML text input.
  dom: { createContainer: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 900 }, debug: false },
  },
  input: { activePointers: 3 },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    CharacterSelectScene,
    BowSelectScene,
    HouseScene,
    ArcheryRangeScene,
    GroceryScene,
    MovingArcheryScene,
    AdventureScene,
    VictoryScene,
    LeaderboardScene,
    GiftShopScene,
    PrizeShowcaseScene,
  ],
};

const game = new Phaser.Game(config);
game.SCENE_KEYS = SCENE_KEYS;
window.game = game;
window.SCENE_KEYS = SCENE_KEYS;

// Hide HTML loader once Phaser boots
window.addEventListener('load', () => {
  setTimeout(() => {
    const el = document.getElementById('loading');
    if (el) el.classList.add('hidden');
  }, 200);
});
