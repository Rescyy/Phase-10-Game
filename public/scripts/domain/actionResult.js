export class ActionResult {
    constructor() {
        this.success = true;
        this.value = null;
    }
    
    static success() {
        return new ActionResult();
    }
}