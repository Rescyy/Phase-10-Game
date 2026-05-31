import { CardColors } from "../consts/colors.js";
import { CardDimensions } from "../consts/dimensions.js";
import { CardType } from "../domain/cardInfo.js";
import { drawTextInCenter } from "../helpers/drawHelpers.js";
import { saveContext, DrawContext, restoreContext, withContext } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { HoldContext } from "../infrastructure/holdContext.js";
import { Entity } from "./entity.js";


export class Card extends Entity {
    constructor(cardInfo) {
        super();
        this.scale = CardDimensions.scale;
        this.holdContext = new HoldContext();
        this.info = cardInfo;
    }

    draw() {
        withContext(() => {
            this.contextPrepare();
            switch (this.info.type) {
                case CardType.NUMBER:
                    drawNumberCard(this.info.number, this.info.color);
                    break;
                case CardType.WILD:
                    drawWildCard();
                    break;
                case CardType.BLOCK:
                    drawBlockCard();
                    break;
                default:
                    throw new Error(`Card type ${this.info.type} doesn't exist`);
            }
        });
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

function drawCardBackground(color) {
    const {
        width, height, radius, margin, incline, fontSize, accent, accentRadius,
    } = CardDimensions;
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
    DrawContext.fillStyle = color;
    DrawContext.fill();
    DrawContext.fillStyle = 'white';
    DrawContext.transform(1, incline, 0, 1, 0, accent - (width * incline + margin) / 2);
    DrawContext.fillRect(-margin / 2, 0, width + margin, height - 2 * accent + margin);
    DrawContext.fillStyle = color;
}

function drawCardRainbow() {
    const {
        width, height, margin, accent, rainbowGap,
    } = CardDimensions;
    const totalHeight = height - 2 * accent + margin;
    const rowHeight = (totalHeight - 5 * rainbowGap) / 4;
    const colors = CardColors.getAll();
    for (let i = 0; i < 4; i++) {
        DrawContext.fillStyle = colors[i];
        DrawContext.fillRect(0, rainbowGap + i * (rainbowGap + rowHeight), width, rowHeight);
    }
}

function drawNumberCard(number, color) {
    const {
        width, height,
    } = CardDimensions;
    drawCardBackground(color);
    drawTextInCenter(number.toString(), 0, 0, width, height);
}

function drawWildCard() {
    const {
        width, height, radius, margin, incline, fontSize, accent, accentRadius,
        starOuterRadius, starInnerRadius, starForegroundRatio, starOffsetY
    } = CardDimensions;
    drawCardBackground('black');
    drawCardRainbow();
    const totalHeight = height - 2 * accent + margin;
    const starY = totalHeight / 2 + starOffsetY;
    const starX = width / 2;
    drawStar(starX, starY, starOuterRadius, starInnerRadius, 'white');
    drawStar(starX, starY, 
        starOuterRadius * starForegroundRatio, 
        starInnerRadius * starForegroundRatio, 
        'black');
}

function drawStar(x, y, outerRadius, innerRadius, color) {
    withContext(() => {
        DrawContext.translate(x, y);
        DrawContext.beginPath();
        DrawContext.moveTo(0, -outerRadius);
        for (let i = 0; i < 5; i++) {
            DrawContext.lineTo(0, -outerRadius);
            DrawContext.rotate(2 * Math.PI / 10);
            DrawContext.lineTo(0, -innerRadius);
            DrawContext.rotate(2 * Math.PI / 10);
        }
        DrawContext.fillStyle = color;
        DrawContext.closePath();
        DrawContext.fill();
    });
}

function drawBlockCard() {
    const {
        width, height, radius, margin, incline, fontSize, accent, accentRadius,
        blockCircleWidth, blockLineWidth, blockMargin
    } = CardDimensions;
    drawCardBackground('black');
    drawCardRainbow();
    const totalHeight = height - 2 * accent + margin;
    withContext(() => {
        DrawContext.translate(width / 2, totalHeight / 2);
        drawBlockCircle('white', blockCircleWidth);
        drawBlockLine('white', blockLineWidth);
        drawBlockCircle('black', blockCircleWidth - blockMargin);
        drawBlockLine('black', blockLineWidth - blockMargin);
    });
}

function drawBlockCircle(color, lineWidth) {
    withContext(() => {
        const blockRadius = CardDimensions.blockRadius;
        DrawContext.beginPath();
        DrawContext.rotate(Math.PI / 4);
        DrawContext.moveTo(0, -blockRadius);
        DrawContext.rotate(Math.PI);
        DrawContext.lineTo(0, -blockRadius);
        DrawContext.lineWidth = lineWidth;
        DrawContext.strokeStyle = color;
        DrawContext.stroke();
    });
}

function drawBlockLine(color, lineWidth) {
    DrawContext.beginPath();
    DrawContext.arc(0, 0, CardDimensions.blockRadius, 0, 2 * Math.PI, false);
    DrawContext.lineWidth = lineWidth;
    DrawContext.strokeStyle = color;
    DrawContext.stroke();
}