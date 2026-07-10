export class DomController {
    static selectPhaseId = 'select-phase';
    static placePhaseId = 'place-phase';
    
    static getSelectPhaseButton() {
        return document.getElementById(this.selectPhaseId);
    }

    static getPlacePhaseButton() {
        return document.getElementById(this.placePhaseId);
    }

    static checkSelectPhaseButton(checked) {
        if (checked) {
            this.getSelectPhaseButton().setAttribute('checked', '');
            this.getPlacePhaseButton().removeAttribute('disabled');
        } else {
            this.getSelectPhaseButton().removeAttribute('checked');
            this.getPlacePhaseButton().setAttribute('disabled', '');
        }
    }
}