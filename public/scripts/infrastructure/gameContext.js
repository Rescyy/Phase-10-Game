import { CardColors } from "../consts/colors.js";
import { Card } from "../entities/card.js";
import { CardHand } from "../entities/cardhand.js";
import { ThrownCards } from "../entities/thrownCards.js";
import { settings } from "./settings.js";

export const GameContext = {
    mouse: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
    },
    holdEntity: null,
};

export function getEntityAt(x, y) {
    const cardHand = GameContext.cardHand.getEntityAt(x, y);
    if (cardHand) return cardHand;
    const thrownCard = GameContext.thrownCards.getEntityAt(x, y);
    if (thrownCard) return thrownCard;
    return null;
}
export function setupGame() {
    const cards = [];
    for (let i = 1; i <= settings.cards; i++) {
        const card = new Card(CardColors.RED, i);
        cards.push(card);
    }
    const cardHand = new CardHand(cards);
    const thrownCards = new ThrownCards();
    GameContext.cardHand = cardHand;
    GameContext.thrownCards = thrownCards;
}

