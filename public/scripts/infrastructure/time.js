export const Time = {
    current: 0,
    delta: 0,
    last: 0,
};

export function updateTime(currentTime) {
    Time.last = Time.current;
    Time.current = currentTime;
    Time.delta = Time.current - Time.last;
}