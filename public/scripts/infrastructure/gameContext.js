import { Card } from "../entities/card.js";
import { CardHand } from "../entities/cardHand.js";
import { ThrownCards } from "../entities/thrownCards.js";
import { CardDeckDimensions, CardHandDimensions, ThrownCardsDimensions } from "../consts/dimensions.js";
import { CardDeck } from "../entities/cardDeck.js";
import { GameService } from "../services/gameService.js";
import { ThrownCard } from "../entities/thrownCard.js";
import { PhaseCards } from "../entities/phaseCards.js";

export const GameContext = {
    mouse: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
    },
    
    holdEntity: null,

    gameService: null,

    step: null,

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
        const seed = 'peach';
        this.gameService = new GameService();
        this.gameService.initialiseGame(seed);
        const cards = this.gameService.takeHand().map(x => new Card(x));
        const cardHand = new CardHand(cards);
        const thrownCards = new ThrownCards();
        thrownCards.cards.push(new ThrownCard(new Card(this.gameService.thrownCards[0])))
        const cardDeck = new CardDeck();
        const phaseCards = new PhaseCards();
        this.entities = {
            cardHand,
            thrownCards,
            cardDeck,
            phaseCards,
        };
    },

    forEachEntity(func) {
        for (const [key, entity] of Object.entries(this.entities)) {
            func(entity);
        }
    },
};

