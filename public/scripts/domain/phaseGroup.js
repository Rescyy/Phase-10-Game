export class PhaseGroup {
    constructor(cardInfos) {
        this.cardInfos = cardInfos;
    }

    canAddCard(cardInfo) {
        const cardInfos = [...this.cardInfos];
        this.cardInfos.push(cardInfo);
        const result = this.validate();
        this.cardInfos = cardInfos;
        return result;
    }

    addCard(cardInfo) {
        const cardInfos = [...this.cardInfos];
        this.cardInfos.push(cardInfo);
        if (!this.validate()) {
            this.cardInfos = cardInfos;
        }
    }

    validate() {
        throw Error("Abstract class");
        return true;
    }
}