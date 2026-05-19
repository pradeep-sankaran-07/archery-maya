import { SCENE_KEYS } from '../config.js';
import ArcheryRangeScene from './ArcheryRangeScene.js';

export default class MovingArcheryScene extends ArcheryRangeScene {
  constructor() {
    super(SCENE_KEYS.Archery2);
  }
  init() {
    this.moving = true;
  }
}
