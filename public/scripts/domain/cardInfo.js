import { CardColors } from '../consts/colors.js';

export const CardType = {
    NUMBER: 'number',
    BLOCK: 'block',
    WILD: 'wild',
}

export class CardInfo {
    constructor() {
        this.type = null;
    }
}

export class NumberCard extends CardInfo {
    constructor(number, color) {
        super();
        if (number < 1 || number > 12 || typeof number !== 'number') {
            throw new Error(`Cannot have card of number ${number}. Must be between 1 and 12`);
        }
        
        if (!CardColors.getAll().includes(color)) {
            if (!CardColors[color]) {
                throw new Error(`Cannot have color ${color}. Only RED, BLUE, GREEN & YELLOW`);
            }
            color = CardColors[color];
        }
        this.type = CardType.NUMBER;
        this.number = number;
        this.color = color;
    }
}

export class BlockCard extends CardInfo {
    constructor() {
        super();
        this.type = CardType.BLOCK;
    }
}

export class WildCard extends CardInfo {
    constructor() {
        super();
        this.type = CardType.WILD;
    }
}
