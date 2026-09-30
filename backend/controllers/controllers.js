import { HomeController } from "./homeController.js";
import { RoomController } from "./roomController.js";

export function initialiseControllers(services) {
    return {
        home: new HomeController(services),
        room: new RoomController(services),
    };
}