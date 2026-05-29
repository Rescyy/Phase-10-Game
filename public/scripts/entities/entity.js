import {DrawContext} from '../infrastructure/drawContext.js';

export class Entity {
     construtor() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
    }

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