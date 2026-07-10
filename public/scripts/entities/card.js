import { CardColors } from "../consts/colors.js";
import { CardDimensions, CardHandDimensions } from "../consts/dimensions.js";
import { CardType } from "../domain/cardInfo.js";
import { drawDebug, drawTextInCenter } from "../helpers/drawHelpers.js";
import { saveContext, DrawContext, restoreContext, withContext } from "../infrastructure/drawContext.js";
import { throwActionError } from "../infrastructure/errorContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { HoldContext } from "../infrastructure/holdContext.js";
import { Entity } from "./entity.js";
import { SelectContext } from "./selectContext.js";


export class Card extends Entity {
    constructor(cardInfo) {
        super();
        this.info = cardInfo;
        this.isNew = false;
        this.selectContext = new SelectContext();
    }

    static Prototype = new Card(null);

    get scale() { return CardDimensions.scale }

    static drawStatic(cardInfo) {
        this.Prototype.info = cardInfo;
        this.Prototype.draw();
    }

    draw() {
        withContext(() => {
            this.contextPrepare();
            drawDebug(() => {
                DrawContext.beginPath();
                DrawContext.arc(0, 0, 10, 0, 2 * Math.PI);
                DrawContext.fill();
            });
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

    static drawBack() {
        withContext(() => {
            drawCardOutline('black', 'black');
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
        const gameService = GameContext.gameService;
        if (gameService.selectingPhase) {
            if (this.info.type === CardType.BLOCK) {
                throwActionError("Cannot use block card for a phase");
            }
            this.selectContext.toggle();
        } else {
            HoldContext.startHolding(e, this);
        }
    }

    handleMouseUp(e) {
        const x = e.offsetX;
        const y = e.offsetY;

        const {
            cardHand, thrownCards,
        } = GameContext.entities;

        try {
            if (thrownCards.isPointIn(x, y)) {
                GameContext.gameService.throwCard(this.info);
                cardHand.removeCard(this);
                HoldContext.swapHolding(thrownCards.addCard(this));
            } else {
                const distances = [];
                const cardIndex = cardHand.getCardIndex(this);
                let index = null;
    
                cardHand.forEachEntity((card, i) => {
                    if (card.isPointIn(x, y)) {
                        if (i < cardIndex || this.isNew) {
                            index = i + 1;
                        } else {
                            index = i;
                        }
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
                            let i = inBetweenCards[0];
                            if (this.isNew) {
                                i++;
                            }
                            return i;
                        }
                        return inBetweenCards[1];
                    })();
                    const distanceToCard = distances.find(x => x.i === inBetweenIndex);
    
                    const maxDist = 0.75;
                    if (distanceToCard) {
                        if (distanceToCard.value < maxDist * maxDist || this.isNew) {
                            index = inBetweenIndex;
                        }
                    } else {
                        if (distances[cardHand.cards.length - 1].value < maxDist * maxDist || this.isNew) {
                            index = cardHand.cards.length;
                        }
                    }
                }
    
                if (index !== null) {
                    if (this.isNew) {
                        cardHand.addCard(this, index);
                        this.isNew = false;
                    } else {
                        cardHand.moveCard(this, index);
                    }
                }
            }
        } finally {
            HoldContext.stopHolding(e);
        }
    }
}

function drawCardOutline(fillStyle, strokeStyle) {
    const {
        width, height, radius,
    } = CardDimensions;
    DrawContext.translate(-width / 2, -height / 2);
    DrawContext.beginPath();
    DrawContext.roundRect(0, 0, width, height, radius);
    DrawContext.fillStyle = fillStyle;
    DrawContext.lineWidth = 2;
    DrawContext.strokeStyle = strokeStyle;
    DrawContext.fill();
    DrawContext.stroke();
}

function drawCardBackground(color) {
    const {
        width, height, radius, margin, incline, accent, accentRadius,
    } = CardDimensions;
    drawCardOutline('white', 'gray');
    DrawContext.beginPath();
    DrawContext.translate(margin, margin);
    DrawContext.scale(1 - 2 * margin / width, 1 - 2 * margin / height);
    DrawContext.roundRect(0, 0, width, height, accentRadius);
    DrawContext.fillStyle = color;
    DrawContext.fill();
    DrawContext.fillStyle = 'white';
    DrawContext.transform(1, incline, 0, 1, 0, accent - (width * incline + margin) / 2);
    const insideHeight = height - 2 * accent + margin;
    DrawContext.fillRect(-margin / 2, 0, width + margin, insideHeight);
    return insideHeight;
}

function drawCardRainbow(insideHeight) {
    const {
        width, height, margin, accent, rainbowGap,
    } = CardDimensions;
    const rowHeight = (insideHeight - 5 * rainbowGap) / 4;
    const colors = CardColors.getAll();
    for (let i = 0; i < 4; i++) {
        DrawContext.fillStyle = colors[i];
        DrawContext.fillRect(0, rainbowGap + i * (rainbowGap + rowHeight), width, rowHeight);
    }
}

function drawCorners(drawSymbol, cornerDimensions) {
    const {
        numberCard,
        width, height
    } = CardDimensions;
    const {
        leftCornerScale, leftCornerX, leftCornerY,
        rightCornerScale, rightCornerX, rightCornerY,
    } = cornerDimensions;
    const drawTopCorners = () =>
    withContext(() => {
        DrawContext.translate(-width / 2, -height / 2);
        withContext(() => {
            DrawContext.translate(leftCornerX, leftCornerY);
            DrawContext.scale(leftCornerScale, leftCornerScale);
            drawSymbol();
        });
        withContext(() => {
            DrawContext.translate(width - rightCornerX, rightCornerY);
            DrawContext.scale(rightCornerScale, rightCornerScale);
            drawSymbol();
        });
    });
    withContext(() => {
        drawTopCorners();
        DrawContext.rotate(Math.PI);
        drawTopCorners();
    });
}

function drawNumberCard(number, color) {
    const {
        width, height, accent, margin, fontSize, incline, numberCard
    } = CardDimensions;
    
    DrawContext.font = `${fontSize}px Georgia`;
    withContext(() => {
        const insideHeight = drawCardBackground(color);
        DrawContext.fillStyle = color;
        drawTextInCenter(number.toString(), 0, 0, width, insideHeight);
    });
    
    DrawContext.fillStyle = 'white';
    drawCorners(() => {
        drawTextInCenter(number.toString(), 0, 0, 0, 0, {incline});
    }, numberCard);
}

function drawWildCard() {
    const {
        width, height, radius, margin, incline, fontSize, accent, accentRadius,
        starOuterRadius, starInnerRadius, starForegroundRatio, starOffsetY,
        starCard,
    } = CardDimensions;
    withContext(() => {
        const insideHeight = drawCardBackground('black');
        drawCardRainbow(insideHeight);
        const starY = insideHeight / 2 + starOffsetY;
        const starX = width / 2;
        drawStar(starX, starY, starOuterRadius, starInnerRadius, 'white');
        drawStar(starX, starY, 
            starOuterRadius * starForegroundRatio, 
            starInnerRadius * starForegroundRatio, 
            'black');
    });
    DrawContext.transform(1, incline, 0, 1, 0, 0);
    drawCorners(() => {
        drawStar(0, 0, starOuterRadius, starInnerRadius, 'white');
    }, starCard);
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
        blockCircleWidth, blockLineWidth, blockMargin, blockCard
    } = CardDimensions;
    withContext(() => {
        const insideHeight = drawCardBackground('black');
        drawCardRainbow(insideHeight);
        DrawContext.translate(width / 2, insideHeight / 2);
        drawBlockCircle('white', blockCircleWidth);
        drawBlockLine('white', blockLineWidth);
        drawBlockCircle('black', blockCircleWidth - blockMargin);
        drawBlockLine('black', blockLineWidth - blockMargin);
    });
    DrawContext.transform(1, incline, 0, 1, 0, 0);
    drawCorners(() => {
        drawBlockCircle('white', blockCircleWidth - blockMargin);
        drawBlockLine('white', blockLineWidth - blockMargin);
    }, blockCard);
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

function drawBack() {

}