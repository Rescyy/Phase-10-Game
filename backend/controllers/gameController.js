import { FileService } from "../services/fileService.js";
import { BaseController } from "./baseController.js";
import { Renderer } from "../renderer.js";

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

        if (room === null || player === null || player.room !== room) {
            return res.redirect('/');
        }

        const model = {
            stylesheets: Renderer.buildStylesheetLinks('/style/lobby.css'),
            roomCode: room.roomCode,
            selfReady: player.ready,
            username: player.username,
        };
        
        const lobbyViewPath = FileService.getViewPath('lobby.html');

        await Renderer.serveRenderedLayoutTemplate(res, lobbyViewPath, model);
        // const gameViewPath = path.join(FileService.publicPath, 'views', 'game.html');
        // await res.sendFile(gameViewPath);
    }
}