import { DrawContext } from "./drawContext.js";
import { GameContext } from "./gameContext.js";
import { Time } from "./time.js";

export const HoldContext = {
    holdEntity: null,
    startHold: Number.NEGATIVE_INFINITY,
    startHoldX: 0,
    startHoldY: 0,
    lastHoldEntity: null,
    lastHold: Number.NEGATIVE_INFINITY,
    lastHoldX: 0,
    lastHoldY: 0,
    scale: 1,

    letGoTimePassed(entity) {
        if (this.isLastHolding(entity)) {
            return Time.current - this.lastHold;
        }
        return Number.POSITIVE_INFINITY;
    },

    startHolding(e, entity) {
        this.startHold = e.timeStamp;
        this.startHoldX = e.offsetX;
        this.startHoldY = e.offsetY;
        this.holdEntity = entity;
    },

    swapHolding(entity) {
        this.holdEntity = entity;
    },

    stopHolding(e) { 
        this.lastHold = Time.current;
        if (e) {
            this.lastHold = e.timeStamp;
            this.lastHoldX = e.offsetX;
            this.lastHoldY = e.offsetY;
        }
        this.lastHoldEntity = this.holdEntity;
        this.holdEntity = null;
    },

    isHolding(entity) {
        return this.holdEntity === entity;
    },

    isLastHolding(entity) {
        return this.lastHoldEntity === entity;
    },

    draw() {
        if (this.holdEntity) {
            const transform = DrawContext.getTransform();
            transform.e = GameContext.mouse.x;
            transform.f = GameContext.mouse.y;
            DrawContext.setTransform(transform);
            DrawContext.scale(this.scale, this.scale);
            this.holdEntity.draw();
            this.scale = 1;
        }
    },
    
    handleMouseUp(e) {
        this.holdEntity?.handleMouseUp(e);
    },
}
