import { ActionError } from '../domain/actionError.js';
import { ErrorContext } from './errorContext.js';
import { GameCanvas } from './gameCanvas.js';
import { GameContext } from "./gameContext.js";

export function setupMouseListeners() {
    GameCanvas.addEventListener('mousedown', handleMouseDown);
    GameCanvas.addEventListener('mouseup', handleMouseUp);
    GameCanvas.addEventListener('click', handleClick);
    GameCanvas.addEventListener('mousemove', handleMouseMove);
}

export function handleClick(e) {
    handleAction(() => {
        GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleClick(e);
    });
}

export function handleMouseDown(e) {
    handleAction(() => {
        GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleMouseDown(e);
    });
}

export function handleMouseUp(e) {
    handleAction(() => {
        if (GameContext.holdEntity) GameContext.holdEntity.handleMouseUp(e);
    });
}

export function handleMouseMove(e) {
    handleAction(() => {
        let x = e.offsetX;
        let y = e.offsetY;
        GameContext.mouse.dx = x - GameContext.mouse.x;
        GameContext.mouse.dy = y - GameContext.mouse.y;
        GameContext.mouse.x = x;
        GameContext.mouse.y = y;
        GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleMouseMove(e);
    });
}

function handleAction(func) {
    try {
        func();
    } catch(e) {
        if (e instanceof ActionError) {
            ErrorContext.setActionError(e);
        }
    }
}
