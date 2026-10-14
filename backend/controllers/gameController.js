import { FileService } from "../services/fileService.js";
import { BaseController } from "./baseController.js";
import path from 'path';
import { Renderer } from "../renderer.js";
import { ChatMessage } from "../domain/chatMessage.js";

export class GameController extends BaseController {
    constructor(services) {
        super(services);
        this.playerService = services.playerService;
        this.chatService = services.chatService;
    }

    registerEndpoints(app) {
        app.get('/game/:roomCode', async (req, res) => await this.getGame(req, res));
    }

    async getGame(req, res) {
        const roomCode = req.params.roomCode;
        
        const room = this.repository.getRoomByRoomCode(roomCode);
        const player = this.playerService.resolvePlayerFromCookie(req);

        if (room === null || player === null) {
            return res.redirect('/');
        }

        const publicId = player.publicId;
        const playerRowContent = await FileService.getViewContent('playerRow.html');

        const playerRows = room.players.map(player => {
            return Renderer.renderTemplate(playerRowContent, {
                ...player,
                self: player.publicId === publicId ? 'self' : '',
            });
        }).join('\n');

        const chatMessageContent = await FileService.getViewContent('chatMessage.html');

        const chatMessages = room.chatMessages.map(chatMessage => {
            return Renderer.renderTemplate(chatMessageContent, {
                ...chatMessage
            });
        }).join('\n');

        const model = {
            stylesheets: Renderer.buildStylesheetLinks('/style/lobby.css'),
            playerRows,
            roomCode: room.roomCode,
            selfReady: player.ready,
        };
        
        const lobbyViewPath = FileService.getViewPath('lobby.html');

        await Renderer.serveRenderedLayoutTemplate(res, lobbyViewPath, model);
        // const gameViewPath = path.join(FileService.publicPath, 'views', 'game.html');
        // await res.sendFile(gameViewPath);
    }
}