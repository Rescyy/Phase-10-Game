export const GameCanvas = document.getElementById('game-canvas');

GameCanvas.area = () => {
    return innerHeight * innerWidth;
};

GameCanvas.scale = () => {
    const scale = Math.sqrt(GameCanvas.area() / screen.availHeight / screen.availWidth);
    return 1;
};

function setCanvasDimensions() {
    console.log(GameCanvas.scale());
    console.log(innerHeight);
    console.log(innerWidth);
    GameCanvas.setAttribute('width', innerWidth - 400);
    GameCanvas.setAttribute('height', innerHeight);
};

setCanvasDimensions();
addEventListener("resize", setCanvasDimensions);
