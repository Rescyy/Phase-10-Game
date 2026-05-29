import { CardColors } from "../consts/colors.js";
import { CardDimensions } from "../consts/dimensions.js";
import { drawTextInCenter } from "../helpers/drawHelpers.js";
import { saveContext, DrawContext, restoreContext, withContext } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { HoldContext } from "../infrastructure/holdContext.js";
import { Entity } from "./entity.js";


export class Card extends Entity {
    constructor(color, number) {
        super();
        this.scale = CardDimensions.scale;
        if (typeof (number) !== 'number' || number > 12 || number < 1) {
            throw new Error(`Cannot have Card number ${number}`);
        }
        if (!Object.values(CardColors).includes(color)) {
            throw new Error(`Cannot have Card color ${color}`);
        }
        this.color = color;
        this.number = number;
        this.holdContext = new HoldContext();
    }

    draw() {
        const {
            width, height, radius, margin, incline, fontSize, accent, accentRadius,
        } = CardDimensions;
        saveContext();
        this.contextPrepare();
        DrawContext.translate(-CardDimensions.width / 2, -CardDimensions.height / 2);
        DrawContext.beginPath();
        DrawContext.roundRect(0, 0, width, height, radius);
        DrawContext.font = `${fontSize}px Georgia`;
        DrawContext.fillStyle = 'white';
        DrawContext.lineWidth = 4;
        DrawContext.strokeStyle = 'gray';
        DrawContext.stroke();
        DrawContext.fill();
        DrawContext.beginPath();
        DrawContext.translate(margin, margin);
        DrawContext.scale(1 - 2 * margin / width, 1 - 2 * margin / height);
        DrawContext.roundRect(0, 0, width, height, accentRadius);
        DrawContext.fillStyle = this.color;
        DrawContext.fill();
        DrawContext.fillStyle = 'white';
        DrawContext.transform(1, incline, 0, 1, 0, -width * incline / 2);
        DrawContext.fillRect(-margin / 2, accent - margin / 2, width + margin, height - 2 * accent + margin);
        DrawContext.fillStyle = this.color;
        drawTextInCenter(this.number.toString(), 0, 0, width, height);
        restoreContext();
    }

    isPointIn(x, y) {
        const {
            width, height, radius
        } = CardDimensions;
        return withContext(() => {
            this.contextPrepare();
            DrawContext.translate(-CardDimensions.width / 2, -CardDimensions.height / 2);
            DrawContext.beginPath();
            DrawContext.roundRect(0, 0, width, height, radius);
            return DrawContext.isPointInPath(x, y);
        });
    }

    handleMouseDown(e) {
        this.holdContext.startHolding(e, this);
    }

    handleMouseUp(e) {
        const x = e.offsetX;
        const y = e.offsetY;

        const {
            cardHand, thrownCards,
        } = GameContext;


        if (thrownCards.isPointIn(x, y)) {
            cardHand.removeCard(this);
            thrownCards.addCard(this);
        } else {
            const distances = [];
            let index = null;

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
                        return inBetweenCards[0];
                    }
                    return inBetweenCards[1];
                })();
                const distanceToCard = distances.find(x => x.i === inBetweenIndex);

                const maxDist = 0.75;
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

            if (index !== null) {
                cardHand.moveCard(this, index);
            }
        }

        this.holdContext.stopHolding(e);
    }
}
