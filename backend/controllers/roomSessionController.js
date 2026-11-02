export class RoomSessionController {
    constructor(services, player, room) {
        this.repository = services.repository;
        this.player = player;
        this.room = room;
    }

    registerEndpoints() {
        const playerSession = this.player.session;
        playerSession.onConnect(() => this.playerConnected());
        playerSession.onDisconnect(() => this.playerDisconnected());
        playerSession.listenMessage('ready', payload => this.playerReady(payload));
        playerSession.listenMessage('getRoomState', () => this.buildRoomState());
    }

    playerConnected() {
        console.log(`${this.player.username} connected to ${this.room.roomCode}`);

        if (!this.room.hasPlayer(this.player)) {
            this.room.addPlayer(this.player);
        }

        this.player.ready = false;
        this.room.broadcastRoomState();

        return true;
    }

    playerDisconnected() {
        console.log(`${this.player.username} disconnected from ${this.room.roomCode}`);

        this.room.removePlayer(this.player);

        this.room.broadcastRoomState();
        
        return true;
    }

    playerReady(payload) {
        if (this.player.ready === payload.ready) {
            return true;
        }

        this.player.ready = payload.ready;
        
        this.room.broadcastRoomState();

        return true;
    }
}