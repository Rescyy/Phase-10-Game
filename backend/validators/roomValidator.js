import { body } from 'express-validator';
import { PASSWORD_LENGTH, ROOM_CODE_LENGTH, ROOM_CODE_REGEX } from '../domain/room.js';
import { USERNAME_LENGTH } from '../domain/player.js';

export class RoomValidator {
    constructor(repository) {
        this.repository = repository;
    }

    validateSubmitRoom(args) {
        let roomCodeRule = body('roomcode')
                .trim()
                .notEmpty().withMessage('Room Code is required.')
                .isLength({ min: ROOM_CODE_LENGTH, max: ROOM_CODE_LENGTH }).withMessage(`Room Code must be ${ROOM_CODE_LENGTH} characters.`)
                .matches(ROOM_CODE_REGEX).withMessage("Room Code can contain only A-Z and 0-9 characters.");

        let passwordRule = body('password')
            .isLength({ max: PASSWORD_LENGTH }).withMessage(`Password cannot be longer than ${PASSWORD_LENGTH} characters.`);

        if (args?.existingRoom) {
            roomCodeRule = roomCodeRule.custom((roomCode) => {
                const room = this.repository.getRoomByRoomCode(roomCode);

                if (!room) {
                    throw new Error('This room does not exist');
                }

                return true;
            });

            passwordRule = passwordRule.custom((password, {req}) => {
                const roomCode = req.body.roomCode;
                const room = this.repository.getRoomByRoomCode(roomCode);
                
                if (!room) {
                    return true;
                }

                if (room.password !== password) {
                    throw new Error('Password for this room is incorrect');
                }

                return true;
            });
        }

        return [
            roomCodeRule,
            body('username')
                .trim()
                .notEmpty().withMessage('Username must not be empty')
                .isLength({ max: USERNAME_LENGTH }).withMessage(`Username cannot be longer than ${USERNAME_LENGTH} characters.`),
            passwordRule,
        ];
    }
}