import { Player } from './player.js';

export class Repository {
    constructor() {
        this.roomCodeToRoomMap = new Map();
        this.privateIdToPlayerMap = new Map();
    }

    getPlayerByPrivateId(privateId) {
        return this.privateIdToPlayerMap.get(privateId) ?? null;
    }

    getRoomByRoomCode(roomCode) {
        return this.roomCodeToRoomMap.get(roomCode) ?? null;
    }

    createPlayer(player) {
        player.assignTimeFields();
        this.privateIdToPlayerMap.set(player.privateId, player);
    }

    createRoom(room) {
        room.assignTimeFields();
        this.roomCodeToRoomMap.set(room.roomCode, room);
    }

    deleteRoom(room) {
        room.players.forEach(player => player.room = null);
        this.roomCodeToRoomMap.delete(room.roomCode);
    }

    serialize() {
        return {
            rooms: Array.from(this.roomCodeToRoomMap.values(), room => ({
                id: room.id,
                createdAt: room.createdAt,
                updatedAt: room.updatedAt,
                roomCode: room.roomCode,
                players: room.players.map(player => ({
                    id: player.id,
                    createdAt: player.createdAt,
                    updatedAt: player.updatedAt,
                    publicId: player.publicId,
                    privateId: player.privateId,
                    username: player.username,
                    ready: player.ready
                    // room intentionally excluded
                }))
            })),

            players: Array.from(this.privateIdToPlayerMap.values(), player => ({
                id: player.id,
                createdAt: player.createdAt,
                updatedAt: player.updatedAt,
                publicId: player.publicId,
                privateId: player.privateId,
                username: player.username,
                ready: player.ready,
                room: player.room?.roomCode,
            }))
        };
    }
}