import { setupMouseListeners } from './infrastructure/listeners.js';
import { setupGame } from './infrastructure/gameContext.js';
import { nextFrame } from './infrastructure/gameLoop.js';

(function main() {
    setupGame();
    setupMouseListeners();
    nextFrame();
})();
