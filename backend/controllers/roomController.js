import path from "path";
import { isValidPassword, isValidRoomCode, PASSWORD_LENGTH, randomRoomCode, Room, ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from "../domain/room.js";
import { Renderer } from "../renderer.js";
import { BaseController } from "./baseController.js";
import { isValidUsername, Player, USERNAME_LENGTH } from "../domain/player.js";
import { FileService } from "../services/fileService.js";
import { PlayerService } from "../services/playerService.js";
import { RoomValidator } from "../validators/roomValidator.js";
import { validationResult } from "express-validator";

export class RoomController extends BaseController {
    constructor(services) {
        super(services);
        this.roomValidator = services.roomValidator;
    }

    registerEndpoints(app) {
        app.get(
            '/create-room', 
            async (req, res) => await this.getCreateRoom(req, res)
        );
        app.post(
            '/create-room',
            this.roomValidator.validateSubmitRoom(), 
            async (req, res) => await this.postCreateRoom(req, res)
        );
        app.get(
            '/join-room',
            async (req, res) => await this.getJoinRoom(req, res)
        );
        app.post(
            '/join-room',
            this.roomValidator.validateSubmitRoom({ existingRoom: true }),
            async (req, res) => await this.postJoinRoom(req, res)
        )
    }

    async getCreateRoom(req, res) {
        const createRoomViewPath = path.join(FileService.dirname, 'views', 'create-room.html');
        const roomCode = randomRoomCode();

        const model = {
            usernameLength: USERNAME_LENGTH,
            roomCodeLength: ROOM_CODE_LENGTH,
            roomCodeChars: ROOM_CODE_CHARACTERS,
            passwordLength: PASSWORD_LENGTH,
            roomCode,
        };

        await Renderer.serveRenderedLayoutTemplate(res, createRoomViewPath, model);
    }

    async postCreateRoom(req, res) {
        if (this.handleValidation(req, res)) {
            return;
        }

        const body = req.body;
        
        const room = new Room();
        room.roomCode = body.roomcode;
        room.password = body.password;
        this.repository.createRoom(room);

        const player = new Player();
        player.username = body.username;
        player.room = room;
        player.createdAt = room.createdAt;
        player.populateIds();
        this.repository.createPlayer(player);

        room.players.push(player);

        PlayerService.setPlayerPrivateId(res, player.privateId);

        return await res.redirect(`/game/${room.roomCode}`);
    }

    async getJoinRoom(req, res) {
        const createRoomViewPath = path.join(FileService.dirname, 'views', 'join-room.html');

        const model = {
            usernameLength: USERNAME_LENGTH,
            roomCodeLength: ROOM_CODE_LENGTH,
            roomCodeChars: ROOM_CODE_CHARACTERS,
            passwordLength: PASSWORD_LENGTH,
        };

        await Renderer.serveRenderedLayoutTemplate(res, createRoomViewPath, model);
    }

    async postJoinRoom(req, res) {
        if (this.handleValidation(req, res)) {
            return;
        }

        const body = req.body;

        const room = this.repository.getRoomByRoomCode(body.roomcode);

        const player = new Player();
        player.username = body.username;
        player.room = room;
        player.populateIds();
        this.repository.createPlayer(player);

        room.players.push(player);

        PlayerService.setPlayerPrivateId(res, player.privateId);

        return await res.redirect(`/game/${room.roomCode}`);
    }
}