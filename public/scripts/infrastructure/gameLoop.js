import { ThrownCardDimensions } from "../consts/dimensions.js";
import { drawTextInCenter } from "../helpers/drawHelpers.js";
import { DrawContext, restoreAllContext, withContext } from "./drawContext.js";
import { ErrorContext } from "./errorContext.js";
import { GameCanvas } from "./gameCanvas.js";
import { GameContext } from "./gameContext.js";
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
    DrawContext.fillStyle = '#eeeeee';
    DrawContext.fillRect(0, 0, GameCanvas.width, GameCanvas.height);   
    GameContext.forEachEntity(x => x.draw());
    DrawContext.drawZ.sort((a, b) => a.z - b.z).forEach(x => x.func());
    DrawContext.drawZ = [];
    
    if (GameContext.holdEntity) {
        const transform = DrawContext.getTransform();
        transform.e = GameContext.mouse.x;
        transform.f = GameContext.mouse.y;
        DrawContext.setTransform(transform);
        GameContext.holdEntity.draw();
    }
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

