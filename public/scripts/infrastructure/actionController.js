import { PhaseCardsTransition } from "../entities/phaseCardsTransition.js";
import { throwActionError } from "./errorContext.js";
import { GameContext } from "./gameContext.js";

export class ActionController {
    static placePhase() {
        const {
            cardHand,
            phaseCards,
        } = GameContext.entities;
        const cardPositions = cardHand.getCardEntitiesPositions();
        const selectedCards = cardPositions.filter(x => x.card.selectContext.isSelected);
        const phaseGroups = GameContext.gameService.phaseService.groupCardsByPhase(selectedCards.map(x => x.card.info));
        if (typeof phaseGroups === 'string') {
            throwActionError(phaseGroups);
        }
        cardHand.cards = cardHand.cards.filter(card => !card.selectContext.isSelected);
        const selectedPositions = phaseGroups.map(phaseGroup => 
            phaseGroup.cardInfos.map(info => {
                const cardPositionIndex = selectedCards.findIndex(x => x.card.info === info);
                const cardPosition = selectedCards.splice(cardPositionIndex, 1)[0];
                return {
                    x: cardPosition.x,
                    y: cardPosition.y,
                    z: cardPosition.z,
                    rotation: cardPosition.rotation,
                };
            })
        );
        phaseCards.placePhase(new PhaseCardsTransition(selectedPositions), phaseGroups);
    }
}