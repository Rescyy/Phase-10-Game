import { GameStep } from "../consts/gameStep.js";
import { DrawContext, saveContext, restoreContext, withContext } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";

// set font ahead of time
export function drawTextInCenter(txt, x, y, width, height, args) {
    args ??= {};
    let {
        incline, foreground,
    } = args;
    if (!incline) incline = 0;
    txt = txt.toString();
    const textRect = DrawContext.measureText(txt);
    const textWidth = textRect.width;
    const textRightYOffset = incline * textWidth;
    const textHeight = textRect.actualBoundingBoxAscent + textRect.actualBoundingBoxDescent;
    const translateX = x + (width - textWidth) / 2;
    const translateY = y + (height + textHeight - textRightYOffset) / 2 - textRect.actualBoundingBoxDescent;
    saveContext();
    DrawContext.translate(translateX, translateY);
    DrawContext.transform(1, incline, 0, 1, 0, 0);
    if (foreground) {
        saveContext();
        DrawContext.fillStyle = foreground;
        DrawContext.translate(0, -textHeight + textRect.actualBoundingBoxDescent);
        DrawContext.fillRect(0, 0, textWidth, textHeight);
        restoreContext();
    }
    DrawContext.fillText(txt, 0, 0);
    restoreContext();
}

export function drawZ(z, func) {
    const transform = DrawContext.getTransform();

    const drawZJob = {
        z,
        executed: false,
        func: () => {
            if (!drawZJob.executed) {
                withContext(() => {
                    DrawContext.setTransform(transform);
                    func();
                });
                drawZJob.executed = true;
            }
        },
    };

    DrawContext.drawZ.push(drawZJob);

    return drawZJob;
}

export function drawDebug(func) {
    if (0) {
        drawZ(101, () => {
            withContext(() => {
                DrawContext.fillStyle = DrawContext.strokeStyle = 'magenta';
                func();
            });
        });
    }
}
