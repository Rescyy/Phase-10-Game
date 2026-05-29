import { setupMouseListeners } from './infrastructure/listeners.js';
import { GameContext } from './infrastructure/gameContext.js';
import { nextFrame } from './infrastructure/gameLoop.js';

(function main() {
    GameContext.setupGame();
    setupMouseListeners();
    nextFrame();
})();
