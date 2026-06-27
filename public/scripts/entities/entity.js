import {DrawContext} from '../infrastructure/drawContext.js';

export class Entity {
    constructor() {
    }

    get x() {return 0}
    get y() {return 0}
    get scale() {return 1}

    draw() {}

    contextPrepare() {
        DrawContext.translate(this.x, this.y);
        DrawContext.scale(this.scale, this.scale);
    }

    getEntityAt(x, y) {
        return this.isPointIn(x, y) ? this : null;
    }

    isPointIn(x, y) {
        return false;
    }

    getPosition() {
        return [this.x, this.y];
    }

    handleClick(e) {}

    handleMouseDown(e) {}

    handleMouseMove(e) {}

    handleMouseUp(e) {}
}