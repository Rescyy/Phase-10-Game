import { DebugController } from "./debugController.js";
import { GameController } from "./gameController.js";
import { HomeController } from "./homeController.js";
import { RoomController } from "./roomController.js";

export function initialiseControllers(services) {
    return {
        home: new HomeController(services),
        room: new RoomController(services),
        game: new GameController(services),
        debug: new DebugController(services),
    };
}