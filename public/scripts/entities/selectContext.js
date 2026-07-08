import { Time } from "../infrastructure/time.js";

export class SelectContext {
    static instances = [];

    constructor() {
        this.isSelected = false;
        this.lastChange = Number.NEGATIVE_INFINITY;
        SelectContext.instances.push(this);
    }

    toggle() {
        this.isSelected = !this.isSelected;
        this.lastChange = Time.current;
    }

    toggleTimePassed() {
        return Time.current - this.lastChange;
    }

    static clearSelections() {
        SelectContext.instances.forEach(x => {
            if (x.isSelected) {
                x.isSelected = false;
                x.lastChange = Time.current;
            }
        });
    }
}