import { Time } from "../infrastructure/time.js";
import { Action } from "./action.js";

class CardHandAction extends Action {
}

export class CardRemove extends CardHandAction {
    constructor(index) {
        super();
        this.type = 'remove';
        this.index = index;
    }
}

export class CardMove extends CardHandAction {
    constructor(from, to) {
        super();
        this.type = 'move';
        this.from = from;
        this.to = to;
    }
}

export class CardAdd extends CardHandAction {
    constructor(index) {
        super();
        this.type = 'add';
        this.index = index;
    }
}

export class CardPlacePhase extends CardHandAction {
    constructor(remainingIndices, hadCards) {
        super();
        this.type = 'placePhase';
        this.remainingIndices = remainingIndices;
        this.hadCards = hadCards;
    }
}
