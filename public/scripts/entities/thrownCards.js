import { drawZ } from '../helpers/drawHelpers.js';
import { ThrownCard } from './thrownCard.js';
import { CardAnimations } from "../consts/animations.js";
import { HoldingZ } from "../consts/consts.js";
import { ThrownCardDimensions } from "../consts/dimensions.js";
import { normalizeRadians, animationLerpTransform } from "../helpers/mathHelpers.js";
import { DrawContext, withContext, forEachContext, contextSetTransform } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { Entity } from "./entity.js";


export class ThrownCards extends Entity {
    constructor() {
        super();
        this.cards = [];
    }

    drawPath() {
        DrawContext.beginPath();
        DrawContext.rect(-ThrownCardDimensions.width / 2, -ThrownCardDimensions.height / 2, ThrownCardDimensions.width, ThrownCardDimensions.height);
    }

    draw() {
        withContext(() => {
            this.contextPrepare();
            this.drawPath();
            DrawContext.fillStyle = '#bbbbbb';
            DrawContext.strokeStyle = '#222222';
            DrawContext.fill();
            DrawContext.stroke();
            let heldCard = null;
            forEachContext(this.cards, card => {
                const holdContext = card.holdContext;
                if (holdContext.isHeld) {
                    heldCard = card;
                    return;
                }

                card.preparePosition();
                if (!CardAnimations.animationFinished(holdContext.letGoTimePassed())) {
                    const throwTransform = DrawContext.getTransform();

                    let rot = normalizeRadians(card.totalRotation());

                    const animation = animationLerpTransform({
                        startX: holdContext.lastHoldX,
                        startY: holdContext.lastHoldY,
                        endX: throwTransform.e,
                        endY: throwTransform.f,
                        startRot: 0,
                        endRot: rot,
                        amt: CardAnimations.getMovementAmt(holdContext.letGoTimePassed()),
                    });
                    contextSetTransform(animation);
                }
                card.draw();
            });
            if (heldCard) {
                const transform = DrawContext.getTransform();
                transform.e = GameContext.mouse.x;
                transform.f = GameContext.mouse.y;
                contextSetTransform(transform);
                drawZ(HoldingZ, () => heldCard.draw());
            }
        });
    }

    isPointIn(x, y) {
        return withContext(() => {
            this.contextPrepare();
            this.drawPath();
            return DrawContext.isPointInPath(x, y);
        });
    }

    addCard(card) {
        this.cards.push(new ThrownCard(card, 0));
    }

    getEntityAt(x, y) {
        if (this.cards.length === 0) return null;
        return withContext(() => {
            this.contextPrepare();
            const lastCard = this.cards[this.cards.length - 1];
            if (lastCard && lastCard.isPointIn(x, y)) {
                return lastCard;
            }
            return null;
        });
    }

    removeCard() {
        this.cards.pop();
    }
}
