import { CardDeckDimensions, CardDimensions } from "../consts/dimensions.js";
import { DrawContext, withContext } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { HoldContext } from "../infrastructure/holdContext.js";
import { Card } from "./card.js";
import { Entity } from "./entity.js";

export class CardDeck extends Entity {
    constructor() {
        super();
    }

    get x() {return CardDeckDimensions.x}
    get y() {return CardDeckDimensions.y}
    get scale() {return CardDeckDimensions.scale * CardDimensions.scale}

    draw() {
        withContext(() => {
            this.contextPrepare();
            Card.drawBack();
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
        const result = GameContext.gameService.takeDeckCard();
        const card = new Card(result);
        card.isNew = true;
        HoldContext.startHolding(e, card);
    }
}