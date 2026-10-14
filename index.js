import express from 'express';
import { initialiseEndpoints } from "./backend/endpoints.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { FileService } from './backend/services/fileService.js';
import { initialiseControllers } from './backend/controllers/controllers.js';
import { Repository } from './backend/domain/repository.js';
import { PlayerService } from './backend/services/playerService.js';
import { RoomValidator } from './backend/validators/roomValidator.js';
import http from 'http';
import { WebSocketServer } from 'ws';
import { WebSocketController } from './backend/controllers/websocketController.js';
import { ChatService } from './backend/services/chatService.js';
import { RoomSessionController } from './backend/controllers/roomSessionController.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
FileService.initialise(__dirname);

const repository = new Repository();
const playerService = new PlayerService(repository);
const roomValidator = new RoomValidator(repository);
const chatService = new ChatService(repository);
const services = {
    repository,
    playerService,
    roomValidator,
    chatService,
};
services.roomSessionController = new RoomSessionController(services);

const controllers = initialiseControllers(services);
const webSocketController = new WebSocketController(services);
wss.on('connection', async (ws, req) => await webSocketController.handleConnection(ws, req));

initialiseEndpoints(app, controllers);

server.listen(12345, () => {
    console.log("Server started listening on port 12345");
});