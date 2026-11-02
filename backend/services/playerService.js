const PRIVATE_ID_KEY = 'private-id-key';

export class PlayerService {
    
    constructor(repository) {
        this.repository = repository;
    }

    resolvePlayerFromCookie(req) {
        const privateId = PlayerService.getPlayerPrivateId(req);
        
        if (!privateId) {
            return null;
        }


        const player = this.repository.getPlayerByPrivateId(privateId);

        if (player) {
            this.cleanPlayerRoom(player);
        }

        return player;
    }

    static setPlayerPrivateId(res, privateId) {
        res.cookie(PRIVATE_ID_KEY, privateId, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
        });
    }

    static getPlayerPrivateId(req) {
        return req.cookies[PRIVATE_ID_KEY];
    }

    cleanPlayerRoom(player) {
        const roomCode = player?.room?.roomCode;

        if (!roomCode) {
            return;
        }

        const room = this.repository.getRoomByRoomCode(roomCode);
        
        if (!room) {
            player.room = null;
        }
    }
}