export const PhaseGroupType = {
    SET: 'set',
    RUN: 'run',
    COLOR: 'color',
    validate(type) {
        if (type !== this.SET && type !== this.RUN && type !== this.COLOR) {
            throw new Error(`Cannot have PhaseGroupTypes ${type}`);
        }
    },
}