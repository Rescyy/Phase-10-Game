import { validationResult } from "express-validator";

export class BaseController {
    constructor(services) {
        this.repository = services.repository;
    }

    registerEndpoints(app) {
        throw new Error('abstract method');
    }

    handleValidation(req, res) {
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return false;
        }

        const formattedErrors = errors.mapped();
        const errorPayload = {};
        
        Object.keys(formattedErrors).forEach(key => {
            errorPayload[key] = formattedErrors[key].msg;
        });

        res.status(400).json({
            errors: errorPayload,
        });

        return true;
    }
}