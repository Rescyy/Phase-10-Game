import { Time } from "./time.js";

class _ErrorContext {
    constructor() {
        this.errorCooldown = null;
        this.errorTime = null;
        this.error = null;
    }

    setActionError(actionError) {
        this.errorCooldown = 5000;
        this.errorTime = Time.current;
        this.error = actionError.message;
    }

    getCurrentError() {
        if (this.errorCooldown && this.errorTime && this.error) {
            if (Time.current < this.errorTime + this.errorCooldown) {
                return this.error;
            }
        }

        return null;
    }
}

export const ErrorContext = new _ErrorContext();