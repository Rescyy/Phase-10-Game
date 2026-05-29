import {GameCanvas} from './gameCanvas.js';

export const DrawContext = GameCanvas.getContext('2d');
DrawContext.drawZ = [];

export function contextSetTransform(m) {
    DrawContext.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
}

export function forEachContext(arr, func) {
    arr.forEach((x, i) => {
        withContext(() => func(x, i));
    });
}

export function withContext(func) {
    saveContext();
    try {
        const result = func();
        return result;
    } catch (e) {
        console.error(e);
    } finally {
        restoreContext();
    }
}

let saveCount = 0;

export function saveContext() {
    saveCount++;
    DrawContext.save();
}

export function restoreContext() {
    if (saveCount > 0) {
        saveCount--;
        DrawContext.restore();
    }
}
export function restoreAllContext() {
    for (; saveCount > 0; saveCount--) {
        DrawContext.restore();
    }
}


