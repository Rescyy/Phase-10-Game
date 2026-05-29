import { Time } from "../infrastructure/time.js";

class CardHandAction {
    constructor() {
        this.time = Time.current;
    }

    get timePassed() {
        return Time.current - this.time;
    }
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
