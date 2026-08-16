export const PhaseCardAddSide = {
    START: 'start',
    END: 'end',
    validate(input) {
        if (input === this.START || input === this.END) {
            return;
        }
        throw new Error(`Cannot have PhaseCardAddPosition ${input}`);
    }
}