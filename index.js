import express from 'express';
import { initialiseEndpoints } from "./backend/endpoints.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { FileService } from './backend/services/fileService.js';
import { initialiseControllers } from './backend/controllers/controllers.js';
import { Repository } from './backend/domain/repository.js';
import { PlayerService } from './backend/services/playerService.js';
import { RoomValidator } from './backend/validators/roomValidator.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
FileService.initialise(__dirname);

const repository = new Repository();
const playerService = new PlayerService(repository);
const roomValidator = new RoomValidator(repository);
const services = {
    repository,
    playerService,
    roomValidator,
};

const controllers = initialiseControllers(services);
initialiseEndpoints(app, controllers);

app.listen(12345);