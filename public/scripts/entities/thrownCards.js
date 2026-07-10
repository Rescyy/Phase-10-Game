import { drawZ } from '../helpers/drawHelpers.js';
import { ThrownCard } from './thrownCard.js';
import { CardAnimations } from "../consts/animations.js";
import { HoldingZ } from "../consts/consts.js";
import { ThrownCardsDimensions } from "../consts/dimensions.js";
import { normalizeRadians, animationLerpTransform } from "../helpers/mathHelpers.js";
import { DrawContext, withContext, forEachContext, contextSetTransform } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { Entity } from "./entity.js";
import { HoldContext } from '../infrastructure/holdContext.js';


export class ThrownCards extends Entity {
    constructor() {
        super();
        this.cards = [];
    }

    get x() {return ThrownCardsDimensions.x}
    get y() {return ThrownCardsDimensions.y}
    get scale() {return ThrownCardsDimensions.scale}

    drawPath() {
        DrawContext.beginPath();
        DrawContext.rect(-ThrownCardsDimensions.size / 2, -ThrownCardsDimensions.size / 2, ThrownCardsDimensions.size, ThrownCardsDimensions.size);
    }

    draw() {
        withContext(() => {
            this.contextPrepare();
            this.drawPath();
            DrawContext.fillStyle = '#bbbbbb';
            DrawContext.strokeStyle = '#222222';
            DrawContext.fill();
            DrawContext.stroke();
            forEachContext(this.cards, card => {
                if (HoldContext.isHolding(card)) {
                    HoldContext.scale = this.scale;
                    return;
                }

                card.preparePosition();
                const letGoTimePassed = HoldContext.letGoTimePassed(card);
                if (!CardAnimations.animationFinished(letGoTimePassed)) {
                    
                    const throwTransform = DrawContext.getTransform();

                    let rot = normalizeRadians(card.totalRotation());

                    const animation = animationLerpTransform({
                        startX: HoldContext.lastHoldX,
                        startY: HoldContext.lastHoldY,
                        endX: throwTransform.e,
                        endY: throwTransform.f,
                        startRot: 0,
                        endRot: rot,
                        amt: CardAnimations.getMovementAmt(letGoTimePassed),
                    });
                    contextSetTransform(animation);
                    DrawContext.scale(this.scale, this.scale);
                }
                card.draw();
            });
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
        const thrownCard = new ThrownCard(card, 0);
        this.cards.push(thrownCard);
        return thrownCard;
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
