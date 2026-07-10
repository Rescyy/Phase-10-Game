import { lerp, lerpClamp } from "../helpers/mathHelpers.js";
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
        return CardHandDimensions.maxWidth / 750 / 2 * 0.8;
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
    static get selectOffset() {
        return this.height / 3 * this.scale;
    }

    static numberCard = {
        leftCornerX: 45,
        leftCornerY: 42,
        leftCornerScale: 0.3,
        rightCornerX: 38,
        rightCornerY: 36,
        rightCornerScale: 0.22,
    };

    static starCard = {
        leftCornerX: 42,
        leftCornerY: 38,
        leftCornerScale: 0.23,
        rightCornerX: 38,
        rightCornerY: 42,
        rightCornerScale: 0.18,
    };

    static blockCard = {
        leftCornerX: 42,
        leftCornerY: 36,
        leftCornerScale: 0.28,
        rightCornerX: 38,
        rightCornerY: 42,
        rightCornerScale: 0.2,
    };
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
    static get minArcGap() { return 80 * this.scale; }
    static get scale() { return 1 };
    static get x() { return GameCanvas.width / 2 };
    static get y() {
        return GameCanvas.height * Math.max(0.82, lerp(1, 0.82, this.width / 650 / devicePixelRatio))
    };
    static maxWidth = 750;
    static get width() {
        return Math.min(GameCanvas.width * 0.8, this.maxWidth);
    }
    static get height() {
        return Math.min(this.width / 8, this.width * this.width / this.maxWidth / this.maxWidth * 50);
    }
};

export class ThrownCardsDimensions {
    static get size() { return Math.max(CardHandDimensions.width * 0.4); }
    static get x() { return GameCanvas.width / 2 };
    static get y() { return GameCanvas.height * Math.max(0.4, lerpClamp(0.7, 0.4, CardHandDimensions.width / 650 / devicePixelRatio)) };
    static get scale() { return 1 };
    static maxPickupRatio = 0.65;
};

export class CardDeckDimensions {
    static get x() { return 0.9 * GameCanvas.width };
    static get y() { return GameCanvas.height * Math.max(0.6, lerpClamp(0.9, 0.6, CardHandDimensions.width / 650 / devicePixelRatio)) };
    static get scale() {return 1}
};

export class PhaseCardsDimensions {
    static get x() { return GameCanvas.width / 2 }
    static get y() { return (CardHandDimensions.y + ThrownCardsDimensions.y + (ThrownCardsDimensions.size - CardDimensions.height * CardDimensions.scale) / 2) / 2 }
    static get width() { return CardHandDimensions.width * 0.7 - CardDimensions.width * CardDimensions.scale }
    static minCardGap = 100;
    static get minGroupGap() { return CardDimensions.width * CardDimensions.scale + 10 } 
    static groupGapWeight = 2;
}
