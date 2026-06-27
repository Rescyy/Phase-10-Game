import { CardColors } from "../consts/colors.js";
import { ActionError } from "../domain/actionError.js";
import { ActionResult } from "../domain/actionResult.js";
import { BlockCard, NumberCard, WildCard } from "../domain/cardInfo.js";
import { shuffleArray } from "../helpers/mathHelpers.js";

export class GameService {
    constructor() {
        this.deck = [];
        this.cardHand = [];
        this.thrownCards = [];
        this.newTurn();
    }

    newTurn() {
        this.cardTaken = false;
        this.cardThrown = false;
    }

    canTakeDeckCard() {
        if (!this.isCurrentPlayerTurn()) {
            this.throwActionError("Cannot take card, it's not your turn");
        }

        if (this.cardTaken) {
            this.throwActionError("Cannot take another card");
        }
    }

    takeDeckCard() {
        this.canTakeDeckCard();
        const card = this.deck.pop();
        this.cardHand.push(card);
        this.cardTaken = true;
        return card;
    }

    canTakeThrownCard() {
        this.canTakeDeckCard();
        if (this.thrownCards.length === 0) {
            this.throwActionError("There are no thrown cards to take");
        }
    }

    takeThrownCard() {
        this.canTakeThrownCard();
        const card = this.thrownCards.pop();
        this.cardHand.push(card);
        this.cardTaken = true;
        return card;
    }

    canThrowCard(card) {
        if (!this.isCurrentPlayerTurn()) {
            this.throwActionError("Cannot throw card, it's not your turn");
        }

        if (!this.cardHand.some(x => x === card)) {
            this.throwActionError("Cannot throw a card that is not in your hand")
        }
        
        if (!this.cardTaken) {
            this.throwActionError("Cannot throw card, you should take one first");
        }
    }

    throwCard(card) {
        this.canThrowCard(card);
        this.cardHand = this.cardHand.filter(x => x !== card);
        this.cardThrown = true;
        this.thrownCards.push(card);
        this.endTurn();
    }

    canEndTurn() {
        if (!this.isCurrentPlayerTurn()) {
            this.throwActionError("Cannot end turn, it's not your turn");
        }

        if (!this.cardTaken) {
            this.throwActionError("Cannot end turn, you must take a card first");
        }

        if (!this.cardThrown) {
            this.throwActionError("Cannot end turn, you must throw away a card");
        }
    }

    endTurn() {
        this.canEndTurn();
        this.newTurn();
    }

    isCurrentPlayerTurn() {
        return true;
    }

    initialiseDeck() {
        this.generateDeck();
        this.shuffleDeck();
    }

    setFirstCard() {
        const card = this.deck.pop();
        if (card) {
            this.thrownCards.push(card);
        }
    }

    initialiseGame() {
        this.initialiseDeck();
        this.setFirstCard();
    }

    generateDeck() {
        const numbered = [];

        for (let i = 1; i <= 12; i++) {
            CardColors.getAll().forEach(color => {
                numbered.push(new NumberCard(i, color));
                numbered.push(new NumberCard(i, color));
            });
        }

        const wildCards = Array.from({length: 8}, () => new WildCard());
        const blockCards = Array.from({length: 4}, () => new BlockCard());

        this.deck = [...numbered, ...wildCards, ...blockCards];
    }

    shuffleDeck() {
        this.deck = shuffleArray(this.deck);
    }

    takeHand() {
        if (this.deck.length < 10) {
            const deck = this.deck;
            this.deck = [];
            return deck;
        }
        this.cardHand = Array.from({ length: 10 }, () => this.deck.pop());
        return this.cardHand;
    }

    throwActionError(message) {
        if (true) {
            throw new ActionError(message);
        }
    }
}