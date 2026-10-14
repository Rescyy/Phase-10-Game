import { parseCookie } from 'cookie';
import cookieParser from 'cookie-parser';
import { match } from 'path-to-regexp';
import url from 'url';
import { PlayerConnectionState, PlayerSession } from '../domain/playerSession.js';
import { Player } from '../domain/player.js';

const routeMatcher = match('/game/:roomCode', { decode: decodeURIComponent });

export class WebSocketController {
    constructor(services) {
        this.repository = services.repository;
        this.playerService = services.playerService;
        this.roomSessionController = services.roomSessionController;
    }

    async handleConnection(ws, req) {
        const clientContext = await this.validateConnection(req, ws);

        if (clientContext === null) {
            return;
        }

        const { room, player } = clientContext;

        player.session = new PlayerSession(player, ws);

        this.roomSessionController.registerEndpoints(player.session);
    }

    validateConnection(req, ws) {
        const parsedUrl = url.parse(req.url);
        
        const pathname = req.url.split('?')[0];
        const matchResult = routeMatcher(pathname);
        
        if (!matchResult) {
            ws.close(4404, "Not found");
            return null;
        }

        const room = this.repository.getRoomByRoomCode(matchResult.params.roomCode);

        req.cookies = parseCookie(req.headers.cookie || '');

        const player = this.playerService.resolvePlayerFromCookie(req);

        if (room === null || player === null) {
            ws.close(4400, "Not associated with a room");
            return null;
        }

        console.log(`Player ${player.username} connected to ${room.roomCode}`);

        return { room, player };
    }
}