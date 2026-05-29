export function normalizeRadians(x) {
    return x - 2 * Math.PI * Math.floor((x + Math.PI) / 2 / Math.PI);
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export function animationLerpTransform(args) {
    const {
        startX, startY, endX, endY, startRot, endRot, amt,
    } = args;

    if (Object.values({ startX, startY, endX, endY, startRot, endRot, amt }).some(v => v === undefined)) {
        throw new Error("Missing required args");
    }

    const lerpX = lerp(startX, endX, amt);
    const lerpY = lerp(startY, endY, amt);
    const rot = lerp(startRot, endRot, amt);
    let transform = new DOMMatrix();
    transform.translateSelf(lerpX, lerpY);
    transform.rotateSelf(rot / Math.PI * 180);
    return transform;
}

