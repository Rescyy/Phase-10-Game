import { GameCanvas } from './gameCanvas.js';
import { GameContext } from "./gameContext.js";

export function setupMouseListeners() {
    GameCanvas.addEventListener('mousedown', handleMouseDown);
    GameCanvas.addEventListener('mouseup', handleMouseUp);
    GameCanvas.addEventListener('click', handleClick);
    GameCanvas.addEventListener('mousemove', handleMouseMove);
}

export function handleClick(e) {
    GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleClick(e);
}

export function handleMouseDown(e) {
    GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleMouseDown(e);
}

export function handleMouseUp(e) {
    if (GameContext.holdEntity) return GameContext.holdEntity.handleMouseUp(e);
}

export function handleMouseMove(e) {
    let x = e.offsetX;
    let y = e.offsetY;
    GameContext.mouse.dx = x - GameContext.mouse.x;
    GameContext.mouse.dy = y - GameContext.mouse.y;
    GameContext.mouse.x = x;
    GameContext.mouse.y = y;
    GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleMouseMove(e);
}

