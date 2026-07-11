import { CardAnimations } from "../consts/animations.js";
import { CardDimensions, PhaseCardsDimensions } from "../consts/dimensions.js";
import { BlockCard, WildCard } from "../domain/cardInfo.js";
import { RunPhaseGroup } from "../domain/runPhaseGroup.js";
import { drawDebug, drawZ } from "../helpers/drawHelpers.js";
import { discreteGradient, lerp } from "../helpers/mathHelpers.js";
import { DrawContext, forEachContext, withContext } from "../infrastructure/drawContext.js";
import { Time } from "../infrastructure/time.js";
import { Card } from "./card.js";
import { Entity } from "./entity.js";

export class PhaseCards extends Entity {
    constructor() {
        super();
        this.phasePlacedTime = Number.NEGATIVE_INFINITY;
        this.phaseGroups = [];
        this.transition = null;
    }

    get x() { return PhaseCardsDimensions.x }
    get y() { return PhaseCardsDimensions.y }

    draw() {
        withContext(() => {
            this.contextPrepare();
            drawDebug(() => {
                DrawContext.beginPath();
                DrawContext.arc(0, 0, 10, 0, 2 * Math.PI);
                DrawContext.fill();
                DrawContext.beginPath();
                DrawContext.strokeRect(-width / 2, -CardDimensions.height * CardDimensions.scale / 2, width, CardDimensions.height * CardDimensions.scale);         
            });
            if (this.phaseGroups.length === 0) return;
            const cardPositions = this.getCardPositions();
            const transition = this.transition;
            const scale = this.scale;

            if (transition && !CardAnimations.animationFinished(transition.timePassed())) {
                const {e: thisX, f: thisY} = DrawContext.getTransform();
                this.phaseGroups.forEach((group, i) => {
                    forEachContext(group.cardInfos, (cardInfo, j) => {
                        const amt = CardAnimations.getMovementAmt(transition.timePassed());
                        const {x,y,rotation} = transition.selectedPositions[i][j];

                        const lerpX = lerp(x, thisX + cardPositions[i][j], amt);
                        const lerpY = lerp(y, thisY, amt);
                        const lerpRotation = lerp(rotation, 0, amt);
                        DrawContext.setTransform(scale, 0, 0, scale, lerpX, lerpY);
                        DrawContext.rotate(lerpRotation);
                        Card.drawStatic(cardInfo);
                    });
                });
            } else {
                this.phaseGroups.forEach((group, i) => {
                    forEachContext(group.cardInfos, (cardInfo, j) => {
                        DrawContext.translate(cardPositions[i][j], 0);
                        Card.drawStatic(cardInfo);
                    });
                }); 
            }
        });
    }

    getCardPositions() {
        const {
            width, minCardGap, groupGapWeight, minGroupGap
        } = PhaseCardsDimensions;
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
        return cardPositions;
    }

    placePhase(transition, phaseGroups) {
        this.transition = transition;
        this.phaseGroups = phaseGroups;
    }
}