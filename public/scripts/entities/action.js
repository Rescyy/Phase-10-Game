import { Time } from "../infrastructure/time.js";

export class Action {
    constructor() {
        this.time = Time.current;
    }

    get timePassed() {
        return Time.current - this.time;
    }
}
