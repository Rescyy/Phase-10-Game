import { drawZ } from '../helpers/drawHelpers.js';
import { CardRemove, CardMove, CardAdd } from './cardHandAction.js';
import { CardAnimations } from "../consts/animations.js";
import { HoldingZ } from "../consts/consts.js";
import { CardHandDimensions } from "../consts/dimensions.js";
import { lerp } from "../helpers/mathHelpers.js";
import { saveContext, forEachContext, DrawContext, restoreContext, withContext } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { Time } from "../infrastructure/time.js";
import { Entity } from "./entity.js";


export class CardHand extends Entity {
    constructor(cards) {
        super();
        this.cards = cards;
        this.action = null;
    }

    getCardsRadians(numCards) {
        let {
            radius, minArcGap, arcLength
        } = CardHandDimensions;
        if (numCards === undefined) {
            numCards = this.cards.length;
        }
        if (numCards === 0) {
            return [];
        }
        if (numCards === 1) {
            return [0];
        }
        arcLength = Math.min(minArcGap * (numCards - 1), arcLength);
        const radians = arcLength / radius;
        const gapRadians = radians / (numCards - 1);
        const leftRadians = -radians / 2;
        const cardsRadians = [];
        for (let i = 0; i < numCards; i++) {
            const cardRotation = leftRadians + i * gapRadians;
            cardsRadians.push(cardRotation);
        }
        return cardsRadians;
    }

    forEachEntity(func, args) {
        const {
            excludeHolding, restPosition,
        } = args;
        let {
            radius,
        } = CardHandDimensions;

        let heldCardIndex = null;
        let cardsRadians = this.getCardsRadians(this.cards.length);
        if (!restPosition && this.action && !CardAnimations.animationFinished(this.action.timePassed)) {
            const amt = CardAnimations.getMovementAmt(Time.current - this.action.time);
            let startRadians;
            switch (this.action.type) {
                case 'remove':
                    startRadians = this.getCardsRadians(this.cards.length + 1);
                    startRadians.splice(this.action.index, 1);
                    break;
                case 'move':
                    const from = this.action.from;
                    const to = this.action.to;
                    startRadians = [...cardsRadians];
                    if (from < to) {
                        for (let i = from; i < to; i++) {
                            startRadians[i] = cardsRadians[i + 1];
                        }
                    } else {
                        for (let i = to; i < from; i++) {
                            startRadians[i + 1] = cardsRadians[i];
                        }
                    }
                    break;
                case 'add':
                    startRadians = this.getCardsRadians(this.cards.length - 1);
                    startRadians.splice(this.action.index, 0, cardsRadians[this.action.index]);
                    break;
            }
            cardsRadians = startRadians
                .map((start, i) => lerp(start, cardsRadians[i], amt));
        }

        saveContext();
        this.contextPrepare();
        forEachContext(this.cards, (card, i) => {
            const holdContext = card.holdContext;
            const cardRotation = cardsRadians[i];

            if (holdContext.isHeld && !restPosition) {
                heldCardIndex = i;
                return;
            }

            DrawContext.translate(0, radius);
            DrawContext.rotate(cardRotation);
            DrawContext.translate(0, -radius);
            if (this.isCardBackInHand(holdContext)) {
                func(card, i);
            } else {
                const amt = CardAnimations.getMovementAmt(holdContext.letGoTimePassed());
                const endTransform = DrawContext.getTransform();
                const lerpX = lerp(holdContext.lastHoldX, endTransform.e, amt);
                const lerpY = lerp(holdContext.lastHoldY, endTransform.f, amt);
                const lerpRotation = lerp(0, cardRotation, amt);
                DrawContext.setTransform(this.scale, 0, 0, this.scale, lerpX, lerpY);
                DrawContext.rotate(lerpRotation);
                func(card, i);
            }
        });

        if (heldCardIndex !== null && !excludeHolding) {
            const transform = DrawContext.getTransform();
            transform.e = GameContext.mouse.x;
            transform.f = GameContext.mouse.y;
            DrawContext.setTransform(transform);
            drawZ(HoldingZ, () => {
                func(this.cards[heldCardIndex], heldCardIndex);
            });
        }
        restoreContext();
    }

    isCardBackInHand(holdContext) {
        return CardAnimations.animationFinished(holdContext.letGoTimePassed());
    }

    draw() {
        this.forEachEntity(card => card.draw(), { excludeHolding: false });
        withContext(() => {
            this.contextPrepare();
            drawZ(100, () => {
                DrawContext.fillStyle = 'green';
                DrawContext.beginPath();
                DrawContext.arc(0, 0, 10, 0, 2 * Math.PI, false);
                DrawContext.fill();
            });
        });
    }

    getEntityAt(x, y) {
        let finalEntity = null;
        this.forEachEntity(card => {
            if (card.isPointIn(x, y)) {
                finalEntity = card;
            }
        }, { excludeHolding: true });
        return finalEntity;
    }

    removeCard(card) {
        const i = this.cards.indexOf(card);
        this.action = new CardRemove(i);
        this.cards.splice(i, 1);
        return this.lastRemovedCardIndex;
    }

    moveCard(card, moveTo) {
        const i = this.cards.indexOf(card);
        this.action = new CardMove(i, moveTo);
        if (i === moveTo) return;
        this.cards.splice(i, 1);
        this.cards.splice(moveTo, 0, card);
    }

    addCard(card, position) {
        this.action = new CardAdd(position);
        this.cards.splice(position, 0, card);
    }

    getCardsCenterOfRotation() {
        return [0, CardHandDimensions.radius];
    }

    getRelativeRadians(x, y) {
        let [handX, handY] = this.getPosition();
        let [centerX, centerY] = this.getCardsCenterOfRotation();
        const relativeX = handX + centerX - x;
        const relativeY = handY + centerY - y;
        const relativeRadians = Math.atan2(-relativeX, relativeY);
        return relativeRadians;
    }

    getInBetweenCards(x, y) {
        const cardsRadians = this.getCardsRadians();
        if (cardsRadians.length === 0) {
            return 0;
        }
        const relativeRadians = this.getRelativeRadians(x, y);
        if (relativeRadians <= cardsRadians[0]) {
            return [0];
        }
        if (relativeRadians >= cardsRadians[cardsRadians.length - 1]) {
            return [cardsRadians.length - 1];
        }
        for (let i = 0; i < cardsRadians.length - 1; i++) {
            if (cardsRadians[i] <= relativeRadians && relativeRadians < cardsRadians[i + 1]) {
                return [i, i + 1];
            }
        }
        throw new Error("unreachable");
    }
}
