import { parseCookie } from 'cookie';
import { match } from 'path-to-regexp';
import { PlayerSession } from '../domain/playerSession.js';
import { RoomSessionController } from './roomSessionController.js';

const routeMatcher = match('/game/:roomCode', { decode: decodeURIComponent });

export class WebSocketController {
    constructor(services) {
        this.services = services;
        this.repository = services.repository;
        this.playerService = services.playerService;
    }

    handleConnection(ws, req) {
        const clientContext = this.validateConnection(req, ws);

        if (clientContext === null) {
            return;
        }

        const { room, player } = clientContext;

        console.log(player.username, room.roomCode);
        if (player.session) {
            player.session.replaceSocket(ws);
        } else {
            player.session = new PlayerSession(player, ws);
        }
        
        new RoomSessionController(this.services, player, room).registerEndpoints(player.session);
        
        player.session.setPlayerConnected();
    }

    validateConnection(req, ws) {
        const pathname = req.url.split('?')[0];
        const matchResult = routeMatcher(pathname);
        
        if (!matchResult) {
            ws.close(4404, "Not found");
            return null;
        }
        
        const room = this.repository.getRoomByRoomCode(matchResult.params.roomCode);
        
        req.cookies = parseCookie(req.headers.cookie || '');

        const player = this.playerService.resolvePlayerFromCookie(req);

        if (room === null || player === null || player.room !== room) {
            ws.close(4400, "Not associated with a room");
            return null;
        }

        console.log(`Player ${player.username} connected to ${room.roomCode}`);

        return { room, player };
    }
}