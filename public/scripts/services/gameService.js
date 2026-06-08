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
            throw new ActionError("Cannot take card, it's not your turn");
        }

        if (this.cardTaken) {
            throw new ActionError("Cannot take another card");
        }

        return ActionResult.success();
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
            throw new ActionError("There are no thrown cards to take");
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
            throw new ActionError("Cannot throw card, it's not your turn");
        }

        if (!this.cardHand.any(x => x === card)) {
            throw new ActionError("Cannot throw a card that is not in your hand")
        }
        
        if (!this.cardTaken) {
            throw new ActionError("Cannot throw card, you should take one first");
        }
    }

    throwCard(card) {
        this.canThrowCard(card);
        this.hand.delete(card);
        this.thrownCard = true;
        this.thrownCardService.throwCard(card);
    }

    canEndTurn() {
        if (!this.isCurrentPlayerTurn()) {
            throw new ActionError("Cannot end turn, it's not your turn");
        }

        if (!this.cardTaken) {
            throw new ActionError("Cannot end turn, you must take a card first");
        }

        if (!this.cardThrown) {
            throw new ActionError("Cannot end turn, you must throw away a card");
        }

        return ActionResult.success();
    }

    endTurn() {
        this.canEndTurn();
        return true;
    }

    isCurrentPlayerTurn() {
        return true;
    }

    initialiseDeck() {
        this.generateDeck();
        this.shuffleDeck();
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
        return Array.from({ length: 10 }, () => this.deck.pop());
    }
}