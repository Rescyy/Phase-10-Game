export class ActionError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}