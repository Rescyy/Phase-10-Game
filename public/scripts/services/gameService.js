import { CardColors } from "../consts/colors.js";
import { ActionError } from "../domain/actionError.js";
import { ActionResult } from "../domain/actionResult.js";
import { BlockCard, NumberCard, WildCard } from "../domain/cardInfo.js";
import { shuffleArray } from "../helpers/mathHelpers.js";
import { throwActionError } from "../infrastructure/errorContext.js";
import { PhaseService } from "./phaseService.js";

export class GameService {
    constructor() {
        this.deck = [];
        this.cardHand = [];
        this.thrownCards = [];
        this.currentPhase = 0;
        this.cardTaken = false;
        this.cardThrown = false;
        this.selectingPhase = false;
        this.phaseService = new PhaseService();
    }

    newTurn() {
        this.cardTaken = false;
        this.cardThrown = false;
        this.selectingPhase = false;
    }

    canTakeDeckCard() {
        if (!this.isCurrentPlayerTurn()) {
            throwActionError("Cannot take card, it's not your turn");
        }

        if (this.cardTaken) {
            throwActionError("Cannot take another card");
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
            throwActionError("There are no thrown cards to take");
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
            throwActionError("Cannot throw card, it's not your turn");
        }

        if (!this.cardHand.some(x => x === card)) {
            throwActionError("Cannot throw a card that is not in your hand")
        }
        
        if (!this.cardTaken) {
            throwActionError("Cannot throw card, you should take one first");
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
            throwActionError("Cannot end turn, it's not your turn");
        }

        if (!this.cardTaken) {
            throwActionError("Cannot end turn, you must take a card first");
        }

        if (!this.cardThrown) {
            throwActionError("Cannot end turn, you must throw away a card");
        }
    }

    endTurn() {
        this.canEndTurn();
        this.newTurn();
    }

    isCurrentPlayerTurn() {
        return true;
    }

    initialiseDeck(seed) {
        this.generateDeck();
        this.shuffleDeck(seed);
    }

    setFirstCard() {
        const card = this.deck.pop();
        if (card) {
            this.thrownCards.push(card);
        }
    }

    initialiseGame(seed) {
        this.initialiseDeck(seed);
        this.setFirstCard();
        this.phaseService.initialiseGame();
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

    shuffleDeck(seed) {
        this.deck = shuffleArray(this.deck, seed);
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

    toggleSelectPhase() {
        if (!this.cardTaken) {
            throwActionError("Cannot select phase, you must take a card first");
        }
        this.selectingPhase = !this.selectingPhase;
        return this.selectingPhase;
    }
}