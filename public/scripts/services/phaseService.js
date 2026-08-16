import { CardType } from "../domain/cardInfo.js";
import { PhaseGroup } from "../domain/phaseGroup.js";
import { PhaseGroupType } from "../domain/phaseGroupTypes.js";
import { PhaseRequirement, PhaseRequirementType } from "../domain/phaseRequirement.js";
import { throwActionError } from "../infrastructure/errorContext.js";

export class PhaseService {
    constructor() {
        this.phases = 10;
        this.current = 4;
    }

    initialiseGame() {
        this.setPhase(this.current);
    }
    
    setPhase(phase) {
        if (phase >= this.phases) {
            throwActionError(`Cannot set phase larger than total phases of ${this.phases}`)
        }
        const phaseItems = document.querySelectorAll('#phase-list li');
        phaseItems.forEach(phaseItem => {
            phaseItem.removeAttribute('class');
        });
        phaseItems.item(phase).setAttribute('class', 'current');
    }

    getPhaseRequirements() {
        return phaseRequirements;
    }

    // returns array of PhaseGroup if phase is valid, else returns error message
    groupCardsByPhase(cards) {
        const notEnoughError = 'Not enough cards selected';
        const tooManyError = 'Too many cards selected';
        const invalidPhaseError = "Cards selected don't make your phase";
        let groupIndex = 0;

        if (cards.some(card => card.type === CardType.BLOCK)) {
            throwActionError('Cannot make phase out of block cards');
        }

        let wildCards, numberCards, groupedCards, hashSetCards;

        const aggregateCards = () => {
            wildCards = cards.filter(card => card.type === CardType.WILD).length;
            numberCards = cards.filter(card => card.type === CardType.NUMBER).sort((a, b) => a.number - b.number);
            hashSetCards = new Set(numberCards.map(x => x.number));
            groupedCards = Object.entries(Object.groupBy(numberCards, card => card.number))
                .map(([key, values]) => ({ key, values }))
                .sort((a, b) => b.values.length - a.values.length);
        };
        
        const requirements = PhaseService.phaseRequirements[this.current];
        const cardsRequired = requirements.reduce((acc, requirement) => acc + requirement.amount, 0);

        if (cardsRequired > cards.length) {
            return notEnoughError;
        } else if (cardsRequired < cards.length) {
            return tooManyError;
        }

        const setRequirements = requirements.filter(requirement => requirement.type === PhaseRequirementType.SET);
        const runRequirements = requirements.filter(requirement => requirement.type === PhaseRequirementType.RUN);
        const colorRequirements = requirements.filter(requirement => requirement.type === PhaseRequirementType.COLOR);
        
        const phaseGroups = [];
        
        const removeNCards = (n, func) => {
            if (n === 0) return [];
            const removed = cards.reduce((acc, card) => {
                if (func(card)) acc.push(card);
                return acc;
            }, []).slice(0, n);
            cards = cards.filter(card => removed.every(x => x !== card));
            return removed;
        };

        for (const requirement of setRequirements) {
            aggregateCards();
            const cards = groupedCards[0].values;

            if (cards.length + wildCards < requirement.amount) {
                return invalidPhaseError;
            }

            const numberCardsUsed = Math.min(requirement.amount, cards.length);
            const wildCardsUsed = Math.max(requirement.amount - numberCardsUsed, 0);

            const removedNumberCards = removeNCards(numberCardsUsed, x => x.type === CardType.NUMBER && x.number === cards[0].number);
            const removedWildCards = removeNCards(wildCardsUsed, x => x.type === CardType.WILD);
            phaseGroups.push(new PhaseGroup([...removedNumberCards, ...removedWildCards], groupIndex++, PhaseGroupType.SET, cards[0].number));
        }

        if (runRequirements.length > 1) {
            throw new Error("Cannot handle more than one run requirements");
        }

        for (const requirement of runRequirements) {
            aggregateCards();

            let runSolution = [];

            for (let i = 1; i <= 12 - requirement.amount; i++) {
                let wilds = 0;
                let countingLeft = true;
                let leftWilds = 0;
                let rightWilds = 0;
                const cardNumbers = [];
                for (let j = 0; j < requirement.amount; j++) {
                    if (hashSetCards.has(i + j)) {
                        cardNumbers.push(i + j);
                        countingLeft = false;
                        rightWilds = 0;
                    } else {
                        if (countingLeft) {
                            leftWilds++;
                        }
                        wilds++;
                        rightWilds++;
                    }
                }
                if (wilds > wildCards) {
                    continue;
                }
                
                runSolution.push({
                    wilds, runStart: i, cardNumbers, leftWilds, rightWilds,
                });
            }
            
            if (runSolution.length === 0) {
                return invalidPhaseError;
            }

            const {
                left, right
            } = cards.reduce((acc, x, i) => {
                if (x.type !== CardType.WILD) {
                    return acc;
                }
                if (i < cards.length / 2) {
                    acc.left++;
                } else if (i > cards.length / 2) {
                    acc.right++;
                }
                return acc;
            }, {left: 0, right: 0});

            function runSolutionComparer(a, b) {
                if (a.wilds < b.wilds) {
                    return a;
                }
                if (b.wilds < a.wilds) {
                    return b;
                }
                const aWildDist = Math.abs(a.leftWilds - left) + Math.abs(a.rightWilds - right);
                const bWildDist = Math.abs(b.leftWilds - left) + Math.abs(b.rightWilds - right);
                if (aWildDist < bWildDist) {
                    return a;
                }
                return b;
            }

            const {
                runStart, cardNumbers, wilds
            } = runSolution.reduce((acc, x) => {
                if (!acc) return x;
                return runSolutionComparer(acc, x);
            }, null)
            
            if (wilds > wildCards) {
                return invalidPhaseError;
            }

            const runGroup = [];
            for (let i = runStart; i < requirement.amount + runStart; i++) {
                let card;
                if (cardNumbers.some(x => x === i)) {
                    [card] = removeNCards(1, x => x.type === CardType.NUMBER && x.number === i);
                } else {
                    [card] = removeNCards(1, x => x.type === CardType.WILD);
                }
                runGroup.push(card);
            }
            
            phaseGroups.push(new PhaseGroup(runGroup, groupIndex++, PhaseGroupType.RUN, runStart));
        }

        if (colorRequirements.length > 1) {
            throw new Error("Cannot handle more than one color requirements");
        }

        if (colorRequirements.length === 1) {
            if (cards.length < colorRequirements.amount) {
                return notEnoughError;
            } else if (cards.length > colorRequirements.amount) {
                return tooManyError;
            }
            const numberCard = cards.find(x => x.type === CardType.NUMBER);
            const color = numberCard?.color;
            const sameColors = cards.every(x => x.type === CardType.WILD || x.color === color);
            phaseGroups.push(new PhaseGroup([...cards], groupIndex++, PhaseGroupType.COLOR, color));
            cards = [];
        }

        if (cards.length > 0) {
            return notEnoughError;
        }

        return phaseGroups;
    }

    // returns array of {start:bool,end:bool} of where it can add that card
    addCardAllowedPositions(phaseGroups, cardInfo) {
        if (cardInfo.type === CardType.BLOCK) {
            return phaseGroups.map(() => {return {start: false, end: false}});
        }
        return phaseGroups.map(group => {
            switch (group.type) {
                case PhaseGroupType.SET:
                    if (cardInfo.type === CardType.WILD || group.hint === cardInfo.number) {
                        return {start: true, end: true};
                    }
                    return {start: false, end: false};
                case PhaseGroupType.RUN:
                    const bounds = {start: false, end: false};
                    const runStart = group.hint;
                    const runEnd = group.hint + group.cardInfos.length - 1;
                    if (runStart > 1) {
                        bounds.start = cardInfo.type === CardType.WILD || cardInfo.number === runStart - 1;
                    }
                    if (runEnd < 12) {
                        bounds.end = cardInfo.type === CardType.WILD || cardInfo.number === runEnd + 1;
                    }
                    return bounds;
                case PhaseGroupType.COLOR:
                    if (cardInfo.type === CardType.WILD || group.hint === cardInfo.color) {
                        return {start: true, end: true};
                    }
                    return {start: false, end: false};
            }
        });
    }

    static phaseRequirements = {
        0: [new PhaseRequirement(PhaseRequirementType.SET, 3), new PhaseRequirement(PhaseRequirementType.SET, 3)],
        1: [new PhaseRequirement(PhaseRequirementType.SET, 3), new PhaseRequirement(PhaseRequirementType.RUN, 4)],
        2: [new PhaseRequirement(PhaseRequirementType.SET, 4), new PhaseRequirement(PhaseRequirementType.RUN, 4)],
        3: [new PhaseRequirement(PhaseRequirementType.RUN, 7)],
        4: [new PhaseRequirement(PhaseRequirementType.RUN, 8)],
        5: [new PhaseRequirement(PhaseRequirementType.RUN, 9)],
        6: [new PhaseRequirement(PhaseRequirementType.SET, 4), new PhaseRequirement(PhaseRequirementType.SET, 4)],
        7: [new PhaseRequirement(PhaseRequirementType.COLOR, 7)],
        8: [new PhaseRequirement(PhaseRequirementType.SET, 5), new PhaseRequirement(PhaseRequirementType.SET, 2)],
        9: [new PhaseRequirement(PhaseRequirementType.SET, 5), new PhaseRequirement(PhaseRequirementType.SET, 3)],
    }
}