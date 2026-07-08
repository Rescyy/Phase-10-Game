import { throwActionError } from "../infrastructure/errorContext.js";

export class PhaseService {
    constructor() {
        this.phases = 10;
    }

    setPhase(phase) {
        if (phase >= this.phases) {
            throwActionError(`Cannot set phase larger than total phases of ${this.phases}`)
        }
        const phaseItems = document.querySelectorAll('#phase-list li');
        phaseItems.forEach(phaseItem => {
            phaseItem.removeAttribute('class');
        });
        phaseItems.item(phase).setAttribute('class', 'current');
    }
}