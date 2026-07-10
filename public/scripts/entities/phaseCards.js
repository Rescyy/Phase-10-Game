import { CardDimensions, PhaseCardsDimensions } from "../consts/dimensions.js";
import { BlockCard, WildCard } from "../domain/cardInfo.js";
import { RunPhaseGroup } from "../domain/runPhaseGroup.js";
import { drawDebug } from "../helpers/drawHelpers.js";
import { discreteGradient } from "../helpers/mathHelpers.js";
import { DrawContext, forEachContext, withContext } from "../infrastructure/drawContext.js";
import { Card } from "./card.js";
import { Entity } from "./entity.js";

export class PhaseCards extends Entity {
    constructor() {
        super();
        this.phasePlacedTime = Number.NEGATIVE_INFINITY;
        this.phaseGroups = [];
    }

    get x() { return PhaseCardsDimensions.x }
    get y() { return PhaseCardsDimensions.y }

    draw() {
        const {
            width, minCardGap, groupGapWeight, minGroupGap
        } = PhaseCardsDimensions;
        withContext(() => {
            this.contextPrepare();
            drawDebug(() => {
                DrawContext.beginPath();
                DrawContext.arc(0, 0, 10, 0, 2 * Math.PI);
                DrawContext.fill();
                DrawContext.beginPath();
                DrawContext.strokeRect(-width / 2, -CardDimensions.height * CardDimensions.scale / 2, width, CardDimensions.height * CardDimensions.scale);         
            });
            if (this.phaseGroups.length === 0) return;;
            const totalCards = this.phaseGroups.reduce((acc, group) => acc + group.cardInfos.length, 0);
            const cardGaps = totalCards - this.phaseGroups.length;
            const groupGaps = this.phaseGroups.length - 1;
            const totalGaps = cardGaps + groupGaps * groupGapWeight;
            let gapWidth = width / totalGaps;
            let groupGap = gapWidth * groupGapWeight;
            if (groupGap < minGroupGap) {
                const adjustment = minGroupGap - groupGap;
                groupGap = minGroupGap;
                gapWidth -= adjustment / cardGaps;
            }
            const cardPositions = [];
            let consumedWidth = -width / 2;

            this.phaseGroups.forEach((group, i) => {
                const cardInfos = group.cardInfos;
                const positions = cardInfos.map(() => {
                    const x = consumedWidth;
                    consumedWidth += gapWidth;
                    return x;   
                });
                cardPositions.push(positions);
                consumedWidth += groupGap - gapWidth;
            });
            
            this.phaseGroups.forEach((group, i) => {
                forEachContext(group.cardInfos, (cardInfo, j) => {
                    DrawContext.translate(cardPositions[i][j], 0);
                    Card.drawStatic(cardInfo);
                });
            }); 
        });
    }

    placePhase(phaseGroups) {
        this.phaseGroups = phaseGroups;
    }
}