export function normalizeRadians(x) {
    return x - 2 * Math.PI * Math.floor((x + Math.PI) / 2 / Math.PI);
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export function lerpClamp(start, end, amt) {
    if (amt < 0) amt = 0;
    else if (amt > 1) amt = 1;
    return lerp(start, end, amt);
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

export function shuffleArray(array, seed) {
    // Create a copy to avoid mutating the original array
    const shuffled = [...array]; 
    const arng = new alea(seed);

    for (let i = shuffled.length - 1; i > 0; i--) {
        // Generate a random index from 0 to i
        const random = Math.abs(arng.int32());
        const j = random % (i + 1);

        // Swap elements using destructuring assignment
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

export function discreteGradient(start, end, n) {
    if (n === 1) {
        return [(end - start) / 2];
    }
    const gap = (end - start) / (n - 1);
    return Array.from({length: n}, (v, i) => start + gap * i);
}
