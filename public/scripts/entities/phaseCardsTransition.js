import { Time } from "../infrastructure/time.js";

export class PhaseCardsTransition {
    constructor(selectedPositions) {
        this.startTime = Time.current;
        this.selectedPositions = selectedPositions; // array of phasegroups [ array of mappings [{x,y,z,rotation}]]
    }

    timePassed() {
        return Time.current - this.startTime;
    }
}