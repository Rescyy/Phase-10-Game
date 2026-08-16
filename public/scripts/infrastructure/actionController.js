import { PhaseCardsPlacePhase } from "../entities/phaseCardAction.js";
import { SelectContext } from "../entities/selectContext.js";
import { DomController } from "./domController.js";
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
        const phaseGroups = GameContext.gameService.placePhase(selectedCards.map(x => x.card.info));
        cardHand.placePhase();
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
        phaseCards.placePhase(new PhaseCardsPlacePhase(selectedPositions), phaseGroups);
        DomController.checkSelectPhaseButton(false);
    }

    static toggleSelectPhase() {
        const checked = GameContext.gameService.toggleSelectPhase();

        DomController.checkSelectPhaseButton(checked);

        if (!checked) {
            SelectContext.clearSelections();
        }
    }
}