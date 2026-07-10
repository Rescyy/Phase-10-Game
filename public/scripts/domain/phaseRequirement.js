export class PhaseRequirement {
    constructor(type, amount) {
        if (amount < 2 || amount > 10) {
            throw Error(`The Requirement Amount of ${amount} is invalid`);
        }
        if (!PhaseRequirementType[type] && Object.values(PhaseRequirementType).every(x => x !== type)) {
            throw Error(`Unknown phase requirement type ${type}`);
        } else {
            type = type.toLowerCase();
        }
        this.type = type;
        this.amount = amount;
    }
}

export const PhaseRequirementType = {
    RUN: 'run',
    SET: 'set',
    COLOR: 'color',
}