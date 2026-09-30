import { Player } from './player.js';

export class Repository {
    constructor() {
        this.roomCodeToRoomMap = new Map();
        this.privateIdToPlayerMap = new Map();
    }

    getPlayerByPrivateId(privateId) {
        return this.privateIdToPlayerMap.get(privateId);
    }

    getRoomByRoomCode(roomCode) {
        return this.roomCodeToRoomMap.get(roomCode);
    }

    createPlayer(player) {
        player.assignTimeFields();
        this.privateIdToPlayerMap.set(player.privateId, player);
    }

    createRoom(room) {
        room.assignTimeFields();
        this.roomCodeToRoomMap.set(room.roomCode, room);
    }
}