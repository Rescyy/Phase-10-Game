export class Entity {
    constructor() {
        this.id = null;
        this.createdAt = null;
        this.udpatedAt = null;
    }

    assignTimeFields() {
        this.createdAt ??= Date.now();
        this.updatedAt ??= Date.now();
    }

    fromDb(model) {
        this.id = model.id;
        this.createdAt = model.created_at;
        this.udpatedAt = model.updated_at;
    }
}