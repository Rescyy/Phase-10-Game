import { Renderer } from "../renderer.js";
import { FileService } from "../services/fileService.js";
import { BaseController } from "./baseController.js";
import path from 'path';

export class HomeController extends BaseController {
    constructor(services) {
        super(services);
        this.playerService = services.playerService;
    }

    registerEndpoints(app) {
        app.get('/', async (req, res) => await this.index(req, res));
    }

    async index(req, res) {
        const indexViewPath = path.join(FileService.dirname, 'views', 'index.html');

        const player = this.playerService.resolvePlayerFromCookie(req);

        const roomCode = player?.room?.roomCode;
        
        const model = {
            buttons: {
                connectBackTo: roomCode ? `<button class="button" onclick="window.location.href='/game/${roomCode}'">
                                        Connect Back To ${roomCode}
                                </button>` : '',
            },
        };

        await Renderer.serveRenderedLayoutTemplate(res, indexViewPath, model);
    }
}