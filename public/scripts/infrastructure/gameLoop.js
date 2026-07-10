import { ThrownCardsDimensions } from "../consts/dimensions.js";
import { GameStep } from "../consts/gameStep.js";
import { drawTextInCenter } from "../helpers/drawHelpers.js";
import { DrawContext, restoreAllContext, withContext } from "./drawContext.js";
import { ErrorContext } from "./errorContext.js";
import { GameCanvas } from "./gameCanvas.js";
import { GameContext } from "./gameContext.js";
import { HoldContext } from "./holdContext.js";
import { settings } from "./settings.js";
import { updateTime } from "./time.js";


export function update() {
    const {
        cardHand,
    } = GameContext;
}

export function draw() {
    const {
        entities
    } = GameContext;
    GameContext.step = GameStep.DRAW;
    DrawContext.fillStyle = '#eeeeee';
    DrawContext.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
    DrawContext.fillStyle = '#bbbbbb';
    DrawContext.fillRect(0, 0, 100, 100);
    GameContext.forEachEntity(x => x.draw());
    DrawContext.drawZ.filter(x => x.z <= 100).sort((a, b) => a.z - b.z).forEach(x => x.func());
    HoldContext.draw();
    DrawContext.drawZ.filter(x => x.z > 100).sort((a, b) => a.z - b.z).forEach(x => x.func());
    DrawContext.drawZ = [];
    GameContext.step = GameStep.DRAW;
}

export function gameLoop(currentTime) {
    updateTime(currentTime);
    try {
        update();
        withContext(draw);
    } catch (error) {
        console.error(error);
    } finally {
        restoreAllContext();
        const error = ErrorContext.getCurrentError();
        if (error) {
            DrawContext.font = "20px Georgia";
            DrawContext.fillStyle = "black";
            DrawContext.fillText(error, 100, 100);
        }
        nextFrame();
    }
}
export function nextFrame() {
    requestAnimationFrame(gameLoop);
}

