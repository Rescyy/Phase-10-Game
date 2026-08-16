import { CardAnimations } from "../consts/animations.js";
import { HoverColors } from "../consts/colors.js";
import { CardDimensions, PhaseCardsDimensions } from "../consts/dimensions.js";
import { BlockCard, WildCard } from "../domain/cardInfo.js";
import { drawDebug, drawZ } from "../helpers/drawHelpers.js";
import { discreteGradient, lerp } from "../helpers/mathHelpers.js";
import { DrawContext, forEachContext, withContext } from "../infrastructure/drawContext.js";
import { GameContext } from "../infrastructure/gameContext.js";
import { HoldContext } from "../infrastructure/holdContext.js";
import { Time } from "../infrastructure/time.js";
import { Card } from "./card.js";
import { Entity } from "./entity.js";
import { PhaseCardAdd } from "./phaseCardAction.js";
import { PhaseCardAddSide } from "./phaseCardAddSide.js";
import { ThrownCard } from "./thrownCard.js";

export class PhaseCards extends Entity {
    constructor() {
        super();
        this.phasePlacedTime = Number.NEGATIVE_INFINITY;
        this.phaseGroups = [];
        this.action = null;
    }

    get x() { return PhaseCardsDimensions.x }
    get y() { return PhaseCardsDimensions.y }

    draw() {
        withContext(() => {
            this.contextPrepare();
            drawDebug(() => {
                const {
                    width
                } = PhaseCardsDimensions;
                const {
                    height, scale
                } = CardDimensions;
                DrawContext.beginPath();
                DrawContext.arc(0, 0, 10, 0, 2 * Math.PI);
                DrawContext.fill();
                DrawContext.beginPath();
                DrawContext.strokeRect(-width / 2, -height * scale / 2, width, height * scale);
                
                const { groupGap } = this.computeGapWidths();
                const groupBounds = this.getHoverPositions();
                groupBounds.forEach(bound => {
                    const {start, end} = bound;
                    DrawContext.beginPath();
                    DrawContext.strokeRect(start, -height * scale / 2, end - start, height * scale);
                    withContext(() => {
                        DrawContext.strokeStyle = 'cyan';
                        DrawContext.lineWidth = 5;
                        DrawContext.translate(start, 0);
                        DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                        Card.drawDebug(0, 0, {withCenter: false});
                    });
                    withContext(() => {
                        DrawContext.strokeStyle = 'cyan';
                        DrawContext.lineWidth = 5;
                        DrawContext.translate(end, 0);
                        DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                        Card.drawDebug(0, 0, {withCenter: false});
                    });
                });
                
            });
            if (this.phaseGroups.length === 0) return;
            const cardPositions = this.getCardPositions();
            const action = this.action;
            const scale = this.scale;

            if (action && !CardAnimations.animationFinished(action.timePassed)) {
                const amt = CardAnimations.getMovementAmt(action.timePassed);
                const {e: thisX, f: thisY} = DrawContext.getTransform();
                
                switch (action.type) {
                    case 'placePhase': 
                        this.phaseGroups.forEach((group, i) => {
                            forEachContext(group.cardInfos, (cardInfo, j) => {
                                const {x,y,rotation} = action.selectedPositions[i][j];
                                const lerpX = lerp(x, thisX + cardPositions[i][j], amt);
                                const lerpY = lerp(y, thisY, amt);
                                const lerpRotation = lerp(rotation, 0, amt);
                                DrawContext.setTransform(scale, 0, 0, scale, lerpX, lerpY);
                                DrawContext.rotate(lerpRotation);
                                Card.drawStatic(cardInfo);
                            });
                        });
                        break;
                    case 'add':
                        const { groupIndex, side, x: actionX, y: actionY } = action;
                        const groupLengths = this.getGroupLengths();
                        const prevGroupLengths = [...groupLengths];
                        prevGroupLengths[groupIndex]--;
                        const groupPositions = PhaseCards.getCardPositionsCore(groupLengths);
                        const prevGroupPositions = PhaseCards.getCardPositionsCore(prevGroupLengths);
                        let addedCardX = null;
                        switch (side) {
                            case PhaseCardAddSide.START:
                                addedCardX = groupPositions[groupIndex].shift();
                                break;
                            case PhaseCardAddSide.END:
                                addedCardX = groupPositions[groupIndex].pop();
                                break;
                        }

                        groupPositions.forEach((group, i) => {
                            const prevGroup = prevGroupPositions[i];
                            const shiftIndex = side === PhaseCardAddSide.START ? 1 : 0;
                            const drawActionCard = (cardInfo) => {
                                const lerpX = lerp(actionX, thisX + addedCardX, amt);
                                const lerpY = lerp(actionY, thisY, amt);
                                DrawContext.setTransform(scale, 0, 0, scale, lerpX, lerpY);
                                Card.drawStatic(cardInfo);
                            }
                            if (side === PhaseCardAddSide.START && i === groupIndex) {
                                drawActionCard(this.phaseGroups[groupIndex].cardInfos[0]);
                            }
                            forEachContext(group, (x, j) => {
                                const lerpX = lerp(prevGroup[j], x, amt);
                                DrawContext.setTransform(scale, 0, 0, scale, thisX + lerpX, thisY);
                                Card.drawStatic(this.phaseGroups[i].cardInfos[j + shiftIndex]);
                            });
                            if (side === PhaseCardAddSide.END && i === groupIndex) {
                                drawActionCard(this.phaseGroups[groupIndex].cardInfos[groupLengths[groupIndex] - 1]);
                            }
                        });

                        break;
                }
            } else {
                this.phaseGroups.forEach((group, i) => {
                    forEachContext(group.cardInfos, (cardInfo, j) => {
                        DrawContext.translate(cardPositions[i][j], 0);
                        Card.drawStatic(cardInfo);
                    });
                });
                const holdEntity = HoldContext.holdEntity;
                let holdCardInfo = null;
                if (holdEntity instanceof Card && !holdEntity.isNew) {
                    holdCardInfo = holdEntity.info;
                }
                if (holdEntity instanceof ThrownCard) {
                    holdCardInfo = holdEntity.card.info;
                }
                if (holdCardInfo) {
                    const hoverPositions = this.getHoverPositions();
                    const allowedPositions = this.getAllowedAdds(holdCardInfo);
                    hoverPositions.forEach((positions, i) => {
                        const allowedPosition = allowedPositions[i];
                        const {start, end} = positions;
                        if (allowedPosition.start) {
                            withContext(() => {
                                DrawContext.translate(start, 0);
                                DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                                Card.drawOutline(HoverColors.fill, HoverColors.stroke, HoverColors.lineWidth);
                            });
                        }
                        if (allowedPosition.end) {
                            withContext(() => {
                                DrawContext.translate(end, 0);
                                DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                                Card.drawOutline(HoverColors.fill, HoverColors.stroke, HoverColors.lineWidth);
                            });
                        }
                    });
                }
            }
        });
    }

    static computeGapWidthsCore(groupLengths) {
        const {
            width, minCardGap, groupGapWeight, minGroupGap
        } = PhaseCardsDimensions;
        const totalCards = groupLengths.reduce((acc, group) => acc + group, 0);
        const cardGaps = totalCards - groupLengths.length;
        const groupGaps = groupLengths.length - 1;
        const totalGaps = cardGaps + groupGaps * groupGapWeight;
        let gapWidth = width / totalGaps;
        let groupGap = gapWidth * groupGapWeight;
        if (groupGap < minGroupGap) {
            const adjustment = minGroupGap - groupGap;
            groupGap = minGroupGap;
            gapWidth -= adjustment / cardGaps;
        }
        const totalWidth = cardGaps * gapWidth + groupGaps * groupGap;

        return { groupGap, gapWidth, totalWidth };
    }

    computeGapWidths() {
        return PhaseCards.computeGapWidthsCore(this.getGroupLengths());
    }

    static getCardPositionsCore(groupLengths) {
        const { groupGap, gapWidth, totalWidth } = PhaseCards.computeGapWidthsCore(groupLengths);
        let consumedWidth = -Math.min(PhaseCardsDimensions.width, totalWidth) / 2;

        return groupLengths.map((len, i) => {
            const positions = Array.from({length: len}).map(() => {
                const x = consumedWidth;
                consumedWidth += gapWidth;
                return x;    
            });
            consumedWidth += groupGap - gapWidth;
            return positions;
        });
    }

    getCardPositions() {
        return PhaseCards.getCardPositionsCore(this.getGroupLengths());
    }

    getGroupLengths() {
        return this.phaseGroups.map(group => group.cardInfos.length);
    }

    getHoverPositions() {
        const { groupGap, gapWidth, totalWidth } = this.computeGapWidths();
        const cardHalfWidth = CardDimensions.width * CardDimensions.scale / 2;

        let firstCard = -Math.min(PhaseCardsDimensions.width, totalWidth) / 2;

        return this.phaseGroups.map((group, i) => {
            const lastCard = firstCard + gapWidth * (group.cardInfos.length - 1);
            const bound = {start: firstCard - cardHalfWidth, end: lastCard + cardHalfWidth};
            firstCard = lastCard + groupGap;
            return bound;
        });
    }

    placePhase(action, phaseGroups) {
        this.action = action;
        this.phaseGroups = phaseGroups;
    }

    getEntityAt(x, y) {
        return null;
    }

    isPointIn(x, y) {
        return withContext(() => {
            this.contextPrepare();
            return this.getHoverPositions().some(({start, end}) => 
                [start, end].some(pos =>
                    withContext(() => {
                        DrawContext.translate(pos, 0);
                        DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                        console.log(DrawContext.getTransform());
                        console.log(x, y);
                        Card.drawPath();
                        return DrawContext.isPointInPath(x, y);
                    })
                )
            );
        });
    }

    addPhaseCard(cardInfo, x, y) {
        return withContext(() => {
            this.contextPrepare();
            const hoverPositions =  this.getHoverPositions();
            let groupIndex = null, side = null;
            hoverPositions.some(({start, end}, i) => 
                [{x: start, side: PhaseCardAddSide.START}, {x: end, side: PhaseCardAddSide.END}].some(pos => 
                    withContext(() => {
                        DrawContext.translate(pos.x, 0);
                        DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                        console.log(DrawContext.getTransform());
                        console.log(x, y);
                        Card.drawPath();
                        if (DrawContext.isPointInPath(x, y)) {
                            if (hoverPositions[i][pos.side]) {
                                groupIndex = i;
                                side = pos.side;
                            }
                            return true;
                        }
                    })
                )
            );
            if (groupIndex === null || side === null) {
                return false; //action unsuccesful
            }
            this.phaseGroups = GameContext.gameService.addPhaseCard(cardInfo, groupIndex, side);
            this.action = new PhaseCardAdd(groupIndex, side, x, y);
            return true;
        });
    }
    
    getAllowedAdds(cardInfo) {
        return GameContext.gameService.phaseService.addCardAllowedPositions(this.phaseGroups, cardInfo);
    }
}
