export function randomInt(start, end) {
    if (start > end) throw new Error(`start(${start}) is larger than end(${end})`);
    return Math.floor(Math.random() * (end - start) + start);
}
