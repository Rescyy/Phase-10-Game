import { GameStep } from '../consts/gameStep.js';
import { ActionError } from '../domain/actionError.js';
import { SelectContext } from '../entities/selectContext.js';
import { GameService } from '../services/gameService.js';
import { DomController } from './domController.js';
import { ErrorContext, throwActionError } from './errorContext.js';
import { GameCanvas } from './gameCanvas.js';
import { GameContext } from "./gameContext.js";
import { HoldContext } from './holdContext.js';
import { ActionController } from './actionController.js';

export function setupMouseListeners() {
    GameCanvas.addEventListener('mousedown', handleMouseDown);
    GameCanvas.addEventListener('mouseup', handleMouseUp);
    GameCanvas.addEventListener('click', handleClick);
    GameCanvas.addEventListener('mousemove', handleMouseMove);
    DomController.getSelectPhaseButton().onclick = handleSelectPhase;
    DomController.getPlacePhaseButton().onclick = handlePlacePhase;
}

function handleClick(e) {
    handleAction(() => {
        GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleClick(e);
    });
}

function handleMouseDown(e) {
    handleAction(() => {
        GameContext.getEntityAt(e.offsetX, e.offsetY)?.handleMouseDown(e);
    });
}

function handleMouseUp(e) {
    handleAction(() => HoldContext.handleMouseUp(e));
}

function handleMouseMove(e) {
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

function handleSelectPhase() {
    handleAction(() => {
        const checked = GameContext.gameService.toggleSelectPhase();

        DomController.checkSelectPhaseButton(checked);

        if (!checked) {
            SelectContext.clearSelections();
        }
    });
}

function handlePlacePhase() {
    handleAction(ActionController.placePhase);
}

function handleAction(func) {
    try {
        GameContext.step = GameStep.HANDLER;
        func();
    } catch(e) {
        if (e instanceof ActionError) {
            ErrorContext.setActionError(e);
        } else {
            throw e;
        }
    } finally {
        GameContext.step = null;
    }
}
