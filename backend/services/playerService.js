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

        return this.repository.getPlayerByPrivateId(privateId);
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
}