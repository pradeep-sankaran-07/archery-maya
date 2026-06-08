import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from './config.js';
import { init as initI18n } from './i18n/index.js';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import LanguageSelectScene from './scenes/LanguageSelectScene.js';
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
import LeaderboardViewScene from './scenes/LeaderboardViewScene.js';
import GiftShopScene from './scenes/GiftShopScene.js';
import PrizeShowcaseScene from './scenes/PrizeShowcaseScene.js';

initI18n();

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
    LanguageSelectScene,
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
    LeaderboardViewScene,
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
