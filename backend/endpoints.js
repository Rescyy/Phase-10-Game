import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { isValidRoomCode, randomRoomCode, ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from "./domain/room.js";
import { USERNAME_LENGTH } from "./domain/player.js";
import { FileService } from './services/fileService.js';
import cookieParser from 'cookie-parser';
import { setTimeout } from 'node:timers/promises';

export function initialiseEndpoints(app, controllers) {
    app.use(express.static(FileService.publicPath, { 
        // maxAge: '1d' 
    }));

    // app.use(async (req, res, next) => {
    //     await setTimeout(1000);

    //     next();
    // });

    app.use(express.urlencoded({extended: true}));

    app.use(cookieParser());

    Object.values(controllers).forEach(controller => controller.registerEndpoints(app));
}
