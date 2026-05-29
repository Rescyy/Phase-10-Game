export class CardAnimations {
    static movement = {
        time: 200,
        easeOut: easeOutCubic,
    };

    static getMovementAmt(time) {
        return this.movement.easeOut(time / this.movement.time);
    }

    static animationFinished(time) {
        return this.movement.time <= time;
    }
}

export function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}
