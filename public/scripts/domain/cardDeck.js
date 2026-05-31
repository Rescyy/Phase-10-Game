import { CardColors } from "../consts/colors.js";
import { shuffleArray } from "../helpers/mathHelpers.js";
import { BlockCard, NumberCard, WildCard } from "./cardInfo.js";

export class CardDeck {
    constructor() {
        this.deck = [];
    }

    initialise() {
        this.generate();
        this.shuffle();
    }

    generate() {
        const numbered = [new WildCard()];
        // const numbered = [];

        // for (let i = 1; i <= 12; i++) {
        //     CardColors.getAll().forEach(color => {
        //         numbered.push(new NumberCard(i, color));
        //         numbered.push(new NumberCard(i, color));
        //     });
        // }

        this.deck = numbered;
        // const wildCards = Array.from({length: 8}, () => new WildCard());
        // const blockCards = Array.from({length: 4}, () => new BlockCard());

        // this.deck = [...numbered, ...wildCards, ...blockCards];
    }

    shuffle() {
        this.deck = shuffleArray(this.deck);
    }

    takeCard() {
        return this.deck.pop();
    }

    takeHand() {
        if (this.deck.length < 10) {
            const deck = this.deck;
            this.deck = [];
            return deck;
        }
        return Array.from({ length: 10 }, () => this.takeCard());
    }
}
