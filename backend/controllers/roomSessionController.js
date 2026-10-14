export class RoomSessionController {
    constructor(services) {
        this.repository = services.repository;
    }

    registerEndpoints(playerSession) {
        playerSession.listenMessage('ready', (playerSession, payload) => this.readyMessage(playerSession, payload));
    }

    readyMessage(playerSession, payload) {
        const player = playerSession.player;
        player.ready = payload.ready;
        console.log(`Player ${player.privateId} ready: ${player.ready}`);
        return true;
    }
}