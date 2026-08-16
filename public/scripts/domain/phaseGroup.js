import { CardColors } from "../consts/colors.js";
import { PhaseGroupType } from "./phaseGroupTypes.js";

export class PhaseGroup {
    constructor(cardInfos, index, type, hint) {
        this.cardInfos = cardInfos;
        this.index = index;
        this.type = type;
        switch (hint) {
            case PhaseGroupType.SET:
                if (typeof hint !== 'number' || (1 <= hint && hint <= 12)) {
                    throw new Error("Wrong hint provided, expected number");
                }
                break;
            case PhaseGroupType.RUN: // for the run the hint is the first card
                if (typeof hint !== 'number' || (1 <= hint && hint <= 12)) {
                    throw new Error("Wrong hint provided, expected number");
                }
                break;
            case PhaseGroupType.COLOR:
                if (typeof hint !== 'string' || CardColors.validate(this)) {
                    throw new Error("Wrong hint provided, expected color");
                }
                break;
        }
        this.hint = hint;
    }

    canAddCard(cardInfo) {
        const cardInfos = [...this.cardInfos];
        this.cardInfos.push(cardInfo);
        const result = this.validate();
        this.cardInfos = cardInfos;
        return result;
    }

    addCard(cardInfo) {
        const cardInfos = [...this.cardInfos];
        this.cardInfos.push(cardInfo);
        if (!this.validate()) {
            this.cardInfos = cardInfos;
        }
    }

    validate() {
        throw Error("Abstract class");
        return true;
    }
}