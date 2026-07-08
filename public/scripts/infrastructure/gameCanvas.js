export const GameCanvas = document.getElementById('game-canvas');

GameCanvas.area = () => {
    return GameCanvas.getAttribute('width') * GameCanvas.getAttribute('height');
};

GameCanvas.scale = () => {
    const scale = Math.sqrt(GameCanvas.area() / screen.availHeight / screen.availWidth);
    return 1;
};

function setCanvasDimensions() {
    GameCanvas.setAttribute('width', innerWidth - 200);
    GameCanvas.setAttribute('height', innerHeight);
};

setCanvasDimensions();
addEventListener("resize", setCanvasDimensions);
