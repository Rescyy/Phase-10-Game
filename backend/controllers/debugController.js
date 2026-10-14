import { BaseController } from "./baseController.js";

export class DebugController extends BaseController {
    constructor(services) {
        super(services);
    }

    registerEndpoints(app) {
        app.get('/state', (req, res) => this.getState(req, res));
    }

    getState(req, res) {
        res.json(this.repository.serialize());
    }   
}