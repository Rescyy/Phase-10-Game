import { randomInt } from "../helpers.js";
import { Entity } from "./entity.js";
import { Player } from "./player.js";

export const ROOM_CODE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
export const ROOM_CODE_REGEX = /[A-Z0-9]{5}/;
export const ROOM_CODE_LENGTH = 5;
export const PASSWORD_LENGTH = 20;

export class Room extends Entity {
    constructor() {
        super();
        this.players = [];
        this.roomCode = null;
        this.chatMessages = [];
    }

    addPlayer(player) {
        if (player instanceof Player) {
            this.players.push(player);
            player.room = this;
            return;
        }
        throw new Error('player is not instance of Player');
    }
}

export function randomRoomCode() {
    return Array.from({ length: ROOM_CODE_LENGTH }, randomRoomCodeChar).join('');
}

function randomRoomCodeChar() {
    return ROOM_CODE_CHARACTERS[randomInt(0, ROOM_CODE_CHARACTERS.length)];
}

export function isValidRoomCode(roomCode) {
    return typeof(roomCode) === 'string' && ROOM_CODE_REGEX.test(roomCode);
}

export function isValidPassword(password) {
    return typeof(password) === 'string' && password.length <= PASSWORD_LENGTH;
}