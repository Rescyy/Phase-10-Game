import { Action } from "./action.js";
import { PhaseCardAddSide } from "./phaseCardAddSide.js";

export class PhaseCardAction extends Action {
}

export class PhaseCardAdd extends PhaseCardAction {
    constructor(groupIndex, side, x, y) {
        super();
        this.type = 'add';
        this.groupIndex = groupIndex;
        PhaseCardAddSide.validate(side);
        this.side = side;
        this.x = x;
        this.y = y;
    }
}

export class PhaseCardsPlacePhase extends PhaseCardAction {
    constructor(selectedPositions) {
        super();
        this.type = 'placePhase';
        this.selectedPositions = selectedPositions; // array of phasegroups [ array of mappings [{x,y,z,rotation}]]
    }
}