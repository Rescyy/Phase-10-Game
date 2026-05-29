import { ThrownCardDimensions } from "../consts/dimensions.js";
import { drawTextInCenter } from "../helpers/drawHelpers.js";
import { DrawContext, restoreAllContext, withContext } from "./drawContext.js";
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
        cardHand, thrownCards,
    } = GameContext;
    DrawContext.fillStyle = '#eeeeee';
    DrawContext.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
    withContext(() => {
        thrownCards.x = ThrownCardDimensions.x;
        thrownCards.y = ThrownCardDimensions.y;
        thrownCards.scale = settings.scale;
        thrownCards.draw();
    });
    cardHand.x = settings.x;
    cardHand.y = settings.y;
    cardHand.scale = settings.scale;
    cardHand.draw();
    DrawContext.drawZ.sort((a, b) => a.z - b.z).forEach(x => x.func());
    DrawContext.drawZ = [];
}

export function gameLoop(currentTime) {
    updateTime(currentTime);
    try {
        update();
        draw();
    } catch (error) {
        console.error(error);
    } finally {
        restoreAllContext();
        DrawContext.font = "20px Georgia";
        DrawContext.fillStyle = "black";
        drawTextInCenter(currentTime, 0, 0, 100, 100);
    }
    nextFrame();
}
export function nextFrame() {
    requestAnimationFrame(gameLoop);
}

