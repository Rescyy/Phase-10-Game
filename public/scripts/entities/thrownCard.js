import { easeOutCubic } from "../consts/animations.js";
import { CardDimensions, ThrownCardDimensions } from "../consts/dimensions.js";
import { lerp } from "../helpers/mathHelpers.js";
import { DrawContext, withContext } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { Entity } from "./entity.js";


export class ThrownCard extends Entity {
    constructor(card, dir) {
        super();
        this.card = card;
        this.devDir = dir + lerp(-Math.PI / 3, Math.PI / 3, Math.random());
        this.rotated = lerp(-Math.PI / 8, Math.PI / 8, Math.random());
        this.dev = easeOutCubic(Math.random()) * 20;
    }

    get holdContext() {
        return this.card.holdContext;
    }

    preparePosition() {
        DrawContext.rotate(this.devDir);
        DrawContext.translate(0, -this.dev);
        DrawContext.rotate(this.rotated - this.devDir);
    }

    draw() {
        this.card.draw();
    }

    isPointIn(x, y) {
        return withContext(() => {
            this.preparePosition();
            return this.card.isPointIn(x, y);
        });
    }

    totalRotation() {
        return this.rotated;
    }

    handleMouseDown(e) {
        this.holdContext.startHolding(e, this);
    }

    handleMouseUp(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        const {
            cardHand, thrownCards,
        } = GameContext.entities;

        let index = null;

        if (thrownCards.isPointIn(x, y)) {
            // Do nothing
        } else if (cardHand.cards.length === 0) {
            const dx = x - cardHand.x;
            const dy = y - cardHand.y;
            if (dx * dx + dy * dy < 300 * 300) {
                index = 0;
            }
        } else {
            const distances = [];
    
            cardHand.forEachEntity((card, i) => {
                if (card.isPointIn(x, y)) {
                    index = i + 1;
                    return;
                }
                const transform = DrawContext.getTransform();
                const cardX = transform.e;
                const cardY = transform.f;
                const dx = (cardX - x) / CardDimensions.width / 2;
                const dy = (cardY - y) / CardDimensions.height;
                const distSq = dx * dx + dy * dy;
                distances.push({
                    i,
                    value: distSq,
                });
            }, { restPosition: true });
    
            if (index === null) {
                const inBetweenCards = cardHand.getInBetweenCards(x, y);
        
                const inBetweenIndex = (() => {
                    if (inBetweenCards.length === 1) {
                        if (inBetweenCards[0] === 0) return 0;
                        return inBetweenCards[0] + 1;
                    }
                    return inBetweenCards[1];
                })();
                
                const distanceToCard = distances.find(x => x.i === inBetweenIndex);
        
                const maxDist = ThrownCardDimensions.maxPickupRatio;
        
                if (distanceToCard) {
                    if (distanceToCard.value < maxDist * maxDist) {
                        index = inBetweenIndex;
                    }
                } else {
                    if (distances[cardHand.cards.length - 1].value < maxDist * maxDist) {
                        index = cardHand.cards.length;
                    }
                }
            }
        }

        if (index !== null) {
            thrownCards.removeCard();
            cardHand.addCard(this.card, index);
        }

        this.holdContext.stopHolding(e);
    }
}
