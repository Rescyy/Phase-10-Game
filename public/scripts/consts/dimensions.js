import { GameCanvas } from "../infrastructure/gameCanvas.js";

export const CardDimensions = {
    height: 350,
    width: 225,
    fontSize: 212,
    radius: 18,
    accent: 65,
    accentRadius: 12,
    incline: -0.1,
    margin: 11,
    scale: 0.5,
    rainbowGap: 10,
    starOffsetY: 10,
    starOuterRadius: 112,
    starInnerRadius: 40,
    starForegroundRatio: 0.78,
    blockRadius: 65,
    blockCircleWidth: 52,
    blockLineWidth: 45,
    blockMargin: 14,
};

export const CardHandDimensions = {
    arcLength: 600,
    radius: 750,
    minArcGap: 100,
    x: 600,
    y: 600,
};

export const ThrownCardDimensions = {
    height: 300,
    width: 300,
    x: GameCanvas.width / 2,
    y: GameCanvas.height / 2 - 100,
    maxPickupRatio: 0.65,
};

export const CardDeckDimensions = {
    x: 1100,
    y: 500,
};

