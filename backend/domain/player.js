import { Entity } from "./entity.js";

export const USERNAME_LENGTH = 20;

export class Player extends Entity {
    constructor() {
        super();
        this.room = null;
        this.publicId = null;
        this.privateId = null;
        this.username = null;
    }

    populateIds() {
        this.publicId = crypto.randomUUID();
        this.privateId = crypto.randomUUID();
    }
}

export function isValidUsername(username) {
    return typeof(username) === 'string' && username.length <= USERNAME_LENGTH;
}
