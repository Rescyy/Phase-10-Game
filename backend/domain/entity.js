export class Entity {
    constructor() {
        this.createdAt = null;
        this.udpatedAt = null;
    }

    assignTimeFields() {
        this.createdAt ??= Date.now();
        this.updatedAt ??= Date.now();
    }
}