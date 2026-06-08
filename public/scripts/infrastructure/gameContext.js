import { Card } from "../entities/card.js";
import { CardHand } from "../entities/cardHand.js";
import { ThrownCards } from "../entities/thrownCards.js";
import { CardDeckDimensions, CardHandDimensions, ThrownCardDimensions } from "../consts/dimensions.js";
import { CardDeck } from "../entities/cardDeck.js";
import { GameService } from "../services/gameService.js";

export const GameContext = {
    mouse: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
    },
    
    holdEntity: null,

    gameService: null,

    getEntityAt(x, y) {
        let entity = null;
        this.forEachEntity(e => {
            const entityAt = e.getEntityAt(x, y);
            if (entityAt) {
                entity = entityAt;
            }
        });
        return entity;
    },

    setupGame() {
        this.gameService = new GameService();
        this.gameService.initialiseDeck();
        const cards = this.gameService.takeHand().map(x => new Card(x));
        const cardHand = new CardHand(cards);
        cardHand.x = CardHandDimensions.x;
        cardHand.y = CardHandDimensions.y;
        const thrownCards = new ThrownCards();
        thrownCards.x = ThrownCardDimensions.x;
        thrownCards.y = ThrownCardDimensions.y;
        const cardDeck = new CardDeck();
        cardDeck.x = CardDeckDimensions.x;
        cardDeck.y = CardDeckDimensions.y;
        this.entities = {
            cardHand,
            thrownCards,
            cardDeck,
        };
    },

    forEachEntity(func) {
        for (const [key, entity] of Object.entries(this.entities)) {
            func(entity);
        }
    },
};

