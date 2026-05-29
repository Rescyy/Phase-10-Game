import { CardDeck } from "../domain/cardDeck.js";
import { Card } from "../entities/card.js";
import { CardHand } from "../entities/cardhand.js";
import { ThrownCards } from "../entities/thrownCards.js";

export const GameContext = {
    mouse: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
    },
    
    holdEntity: null,

    deck: null,

    getEntityAt(x, y) {
        const cardHand = GameContext.cardHand.getEntityAt(x, y);
        if (cardHand) return cardHand;
        const thrownCard = GameContext.thrownCards.getEntityAt(x, y);
        if (thrownCard) return thrownCard;
        return null;
    },

    setupGame() {
        this.deck = new CardDeck();
        this.deck.initialise();
        const cards = this.deck.takeHand().map(x => new Card(x));
        const cardHand = new CardHand(cards);
        const thrownCards = new ThrownCards();
        this.cardHand = cardHand;
        this.thrownCards = thrownCards;
    },
};

