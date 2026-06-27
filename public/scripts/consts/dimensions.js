import { lerp } from "../helpers/mathHelpers.js";
import { GameCanvas } from "../infrastructure/gameCanvas.js";

export class CardDimensions {
    static height = 350;
    static width = 225;
    static fontSize = 212;
    static radius = 18;
    static accent = 65;
    static accentRadius = 12;
    static incline = -0.1;
    static margin = 11;
    static get scale() {
        return CardHandDimensions.width / 750 / 2;
    }
    static rainbowGap = 10;
    static starOffsetY = 10;
    static starOuterRadius = 112;
    static starInnerRadius = 40;
    static starForegroundRatio = 0.78;
    static blockRadius = 65;
    static blockCircleWidth = 52;
    static blockLineWidth = 45;
    static blockMargin = 14;
};

export class CardHandDimensions {
    static get radius() {
        const {width, height, scale} = this;
        return (width * width / 8 / height + height / 2);
    }
    static get arcRadians() {
        const {width, radius} = this;
        return 2 * Math.asin(width / 2 / radius);
    }
    static get arcLength() {
        return this.arcRadians * this.radius;
    }
    static get minArcGap() { return 100 * this.scale; }
    static get scale() { return Math.max(Math.sqrt(this.height / this.width / 2), 1) };
    static get x() { return GameCanvas.width / 2 };
    static get y() {
        return GameCanvas.height * Math.max(0.77, lerp(1, 0.77, this.width / 650 / devicePixelRatio))
    };
    static get width() {
        return Math.min(GameCanvas.width * 0.8, 750);
    }
    static get height() {
        return Math.min(this.width / 8, this.width * this.width / 750 / 750 * 50);
    }
};

export class ThrownCardDimensions {
    static get height() { return Math.max(CardHandDimensions.width / 2); }
    static get width() { return Math.max(CardHandDimensions.width / 2); }
    static get x() { return GameCanvas.width / 2 };
    static get y() { return GameCanvas.height * 0.4 };
    static get scale() { return GameCanvas.scale() };
    static maxPickupRatio = 0.65;
};

export class CardDeckDimensions {
    static get x() { return 0.9 * GameCanvas.width };
    static get y() { return 4 * GameCanvas.height / 5 };
};

