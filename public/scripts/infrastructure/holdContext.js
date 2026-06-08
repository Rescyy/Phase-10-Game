import { GameContext } from "./gameContext.js";
import { Time } from "./time.js";

export class HoldContext {
    constructor() {
        this.isHeld = false;
        this.holding = null;
        this.startHold = Number.NEGATIVE_INFINITY;
        this.startHoldX = 0;
        this.startHoldY = 0;
        this.lastHold = Number.NEGATIVE_INFINITY;
        this.lastHoldX = 0;
        this.lastHoldY = 0;
    }

    letGoTimePassed() {
        return Time.current - this.lastHold;
    }

    startHolding(e, entity) {
        this.isHeld = true;
        this.startHold = e.timeStamp;
        this.startHoldX = e.offsetX;
        this.startHoldY = e.offsetY;
        GameContext.holdEntity = entity;
    }

    stopHolding(e) {
        this.isHeld = false;
        this.lastHold = Time.current;
        if (e) {
            this.lastHold = e.timeStamp;
            this.lastHoldX = e.offsetX;
            this.lastHoldY = e.offsetY;
        }
        GameContext.holdEntity = null;
    }
}
