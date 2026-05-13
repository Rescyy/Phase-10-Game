const gameCanvas = document.getElementById('game-canvas');
const height = gameCanvas.height;
const width = gameCanvas.width;
const context = gameCanvas.getContext('2d');

const targetFps = 30;
const frameDuration = 1000 / targetFps;
const time = {
    current: 0,
    delta: 0,
    last: 0,
};

const settings = {
    x: 600,
    y: 600,
    scale: 1,
    cards: 10,
};

const cardHandDimensions = {
    arcLength: 600, 
    radius: 750, 
    minArcGap: 100,
};

const cardDimensions = {
    height: 350,
    width: 225,
    fontSize: 212,
    radius: 18,
    accent: 62,
    accentRadius: 12,
    incline: -0.1,
    margin: 11,
    scale: 0.5,
};

const cardAnimations = {
    backInHand: {
        time: 200,
        easeOut: easeOutCubic,
    },
};

const thrownCardDimensions = {
    height: 300,
    width: 300,
    x: width / 2,
    y: height / 2 - 100,
};

const CardColors = {
    RED: 'red',
    GREEN: 'green',
    BLUE: 'blue',
    YELLOW: 'yellow',
};

function gameLoop(currentTime) {
    updateTime(currentTime);
    try {
        update();
        draw();
    } catch (error) {
        console.error(error);
    } finally {
        restoreAllContext();
        context.font = "20px Georgia";
        context.fillStyle = "black";
        drawTextInCenter(currentTime, 0, 0, 100, 100);
    }
    nextFrame();
}

const gameContext = {
    mouseX: 0,
    mouseY: 0,
    holdContext: null,
};

function initGame() {
    const cards = [];
    for (let i = 1; i <= settings.cards; i++) {
        const card = new Card(CardColors.RED, i);
        cards.push(card);
    }
    const cardHand = new CardHand(cards);
    const thrownCards = new ThrownCards();
    thrownCards.cards = cards.map(card => new ThrownCard(card));
    gameContext.cardHand = cardHand;
    gameContext.thrownCards = thrownCards;

    gameCanvas.addEventListener('mousedown', handleMouseDown);
    gameCanvas.addEventListener('mouseup', handleMouseUp);
    gameCanvas.addEventListener('click', handleClick);
    gameCanvas.addEventListener('mousemove', handleMouseMove);

    nextFrame();
}

function update() {
    const {
        cardHand,
    } = gameContext;
}

function draw() {
    const {
        cardHand,
        thrownCards,
    } = gameContext;
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);
    thrownCards.x = thrownCardDimensions.x;
    thrownCards.y = thrownCardDimensions.y;
    thrownCards.scale = settings.scale;
    thrownCards.draw();
    cardHand.x = settings.x;
    cardHand.y = settings.y;
    cardHand.scale = settings.scale;
    cardHand.draw();
}

function handleClick(e) {
    getEntityAt(e.offsetX, e.offsetY)?.handleClick(e);
}

function handleMouseDown(e) {
    getEntityAt(e.offsetX, e.offsetY)?.handleMouseDown(e);
}

function handleMouseUp(e) {
    getEntityAt(e.offsetX, e.offsetY)?.handleMouseUp(e);
}

function handleMouseMove(e) {
    gameContext.mouseX = e.offsetX;
    gameContext.mouseY = e.offsetY;
    getEntityAt(e.offsetX, e.offsetY)?.handleMouseMove(e);
}

function getEntityAt(x, y) {
    return gameContext.cardHand.getEntityAt(x, y);
}

class Entity {
    construtor() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
    }

    draw() {}

    contextPrepare() {
        context.translate(this.x, this.y);
        context.scale(this.scale, this.scale);
    }

    getEntityAt(x, y) {
        return this.isPointIn(x, y) ? this : null;
    }

    isPointIn(x, y) {
        return false;
    }

    handleClick(e) {}

    handleMouseDown(e) {}

    handleMouseMove(e) {}

    handleMouseUp(e) {}
}

class CardHand extends Entity {
    constructor(cards) {
        super();
        this.cards = cards;
    }

    forEachEntity(func) {
        let {
            radius,
            minArcGap,
            arcLength
        } = cardHandDimensions;
        arcLength = Math.min(minArcGap * (this.cards.length - 1), arcLength);
        const radians = arcLength / radius;
        const gapRadians = radians / (this.cards.length - 1);
        const leftRadians = -radians / 2;
        saveContext();
        this.contextPrepare();
        let heldCard = null;
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const holdContext = card.holdContext;
            const cardRotation = leftRadians + i * gapRadians;
            if (holdContext.isHeld) {
                heldCard = card;
                continue;
            }

            saveContext();
            context.translate(0, radius);
            context.rotate(cardRotation);
            context.translate(0, -radius);
            if (this.isCardBackInHand(holdContext)) {
                func(card);
            } else {
                const amt = cardAnimations.backInHand.easeOut(holdContext.letGoTimePassed()
                / cardAnimations.backInHand.time);
                const endTransform = context.getTransform();
                const lerpX = lerp(holdContext.lastHeldX, endTransform.e, amt);
                const lerpY = lerp(holdContext.lastHeldY, endTransform.f, amt);
                const lerpRotation = lerp(0, cardRotation, amt);
                context.setTransform(this.scale, 0, 0, this.scale, lerpX, lerpY);
                context.rotate(lerpRotation);
                func(card);
            }
            restoreContext();
        }
        if (heldCard) {
            const transform = context.getTransform();
            transform.e = gameContext.mouseX;
            transform.f = gameContext.mouseY;
            context.setTransform(transform);
            func(heldCard);
        }
        restoreContext();
    }

    isCardBackInHand(holdContext) {
        return holdContext.letGoTimePassed() > cardAnimations.backInHand.time;
    }

    draw() {
        this.forEachEntity(card => card.draw());
    }

    getEntityAt(x, y) {
        let finalEntity = null;
        this.forEachEntity(card => {
            if (card.isPointIn(x, y)) {
                finalEntity = card;
            }
        });
        return finalEntity;
    }

    removeCard(card) {
        this.cards = this.cards.filter(x => x === card);
    }
}

class Card extends Entity {
    constructor(color, number) {
        super();
        this.scale = cardDimensions.scale;
        if (typeof(number) !== 'number' || number > 12 || number < 1) {
            throw new Error(`Cannot have Card number ${number}`);
        }
        if (!Object.values(CardColors).includes(color)) {
            throw new Error(`Cannot have Card color ${color}`);
        }
        this.color = color;
        this.number = number;
        this.holdContext = new HoldContext();
    }

    draw() {
        const {
            width,
            height,
            radius,
            margin,
            incline,
            fontSize,
            accent,
            accentRadius,
        } = cardDimensions;
        saveContext();
        this.contextPrepare();
        context.translate(-cardDimensions.width / 2, -cardDimensions.height / 2);
        context.beginPath();
        context.roundRect(0, 0, width, height, radius);
        context.font = `${fontSize}px Georgia`;
        context.fillStyle = 'white';
        context.lineWidth = 4;
        context.strokeStyle = 'gray';
        context.stroke();
        context.fill();
        context.beginPath();
        context.translate(margin, margin);
        context.scale(1 - 2 * margin / width, 1 - 2 * margin / height);
        context.roundRect(0, 0, width, height, accentRadius);
        context.fillStyle = this.color;
        context.fill();
        context.fillStyle = 'white';
        context.transform(1, incline, 0, 1, 0, -width * incline / 2);
        context.fillRect(-margin/2, accent - margin/2, width + margin, height - 2 * accent + margin);
        context.fillStyle = this.color;
        drawTextInCenter(this.number.toString(), 0, 0, width, height);
        restoreContext();
    }

    isPointIn(x, y) {
        const {
            width,
            height,
            radius
        } = cardDimensions;
        return withContext(() => {
            this.contextPrepare();
            context.translate(-cardDimensions.width / 2, -cardDimensions.height / 2);
            context.beginPath();
            context.roundRect(0, 0, width, height, radius);
            return context.isPointInPath(x, y);
        });
    }

    handleMouseDown(e) {
        this.holdContext.startHolding(e, this);
    }

    handleMouseUp(e) {
        this.holdContext.stopHolding(e);
        if (gameContext.thrownCards.isPointIn(e.offsetX, e.offsetY)) {
            gameContext.cardHand.removeCard(this);
            gameContext.thrownCards.addCard(this);
        }
    }
}

class ThrownCard extends Entity {
    constructor(card) {
        super();
        this.card = card;
        this.rotated = Math.random() * Math.PI * 2;
        this.devDir = Math.random() * Math.PI * 2;
        this.dev = easeInQuint(Math.random()) * 20;
    }

    preparePosition() {
        context.rotate(this.devDir);
        context.translate(this.dev, 0);
        context.rotate(this.rotated);
    }

    draw() {
        withContext(() => {
            this.preparePosition();
            this.card.draw();
        });
    }

    isPointIn(x, y) {
        return withContext(() => {
            this.preparePosition();
            return this.card.isPointIn(x, y);
        });
    }
}

class ThrownCards extends Entity {
    constructor() {
        super();
        this.cards = [];
    }

    drawPath() {
        context.beginPath();
        context.rect(-thrownCardDimensions.width / 2, - thrownCardDimensions.height / 2, thrownCardDimensions.width, thrownCardDimensions.height);
    }

    draw() {
        withContext(() => {
            this.contextPrepare();
            this.drawPath();
            context.fillStyle = '#bbbbbb';
            context.strokeStyle = '#222222';
            context.fill();
            context.stroke();
            this.cards.forEach(card => card.draw());
        });
    }

    isPointIn(x, y) {
        return withContext(() => {
            this.contextPrepare();
            this.drawPath();
            return context.isPointInPath(x, y);
        });
    }

    addCard(card) {
        this.cards.push(new ThrownCard(card));
    }
}

class HoldContext {
    constructor() {
        this.isHeld = false;
        this.holding = null;
        this.startHold = 0;
        this.startHoldX = 0;
        this.startHoldY = 0;
        this.lastHold = 0;
        this.lastHoldX = 0;
        this.lastHoldY = 0;
    }

    letGoTimePassed() {
        return time.current - this.lastHold;
    }

    startHolding(e, entity) {
        this.isHeld = true;
        this.startHold = e.timeStamp;
        this.startHoldX = e.offsetX;
        this.startHoldY = e.offsetY;
        gameContext.holdContext = entity;
    }

    stopHolding(e) {
        this.isHeld = false;
        this.lastHold = time.current;
        if (e) {
            this.lastHold = e.timeStamp;
            this.lastHoldX = e.offsetX;
            this.lastHoldY = e.offsetY;
        }
        gameContext.holdContext = null;
    }
}

// set font ahead of time
function drawTextInCenter(txt, x, y, width, height, args) {
    args ??= {};
    let {
        incline,
        foreground,
    } = args;
    if (!incline) incline = 0;
    txt = txt.toString();
    const textRect = context.measureText(txt);
    const textWidth = textRect.width;
    const textRightYOffset = incline * textWidth;
    const textHeight = textRect.actualBoundingBoxAscent + textRect.actualBoundingBoxDescent;
    const translateX = x + (width - textWidth) / 2;
    const translateY = y + (height + textHeight - textRightYOffset) / 2 - textRect.actualBoundingBoxDescent;
    saveContext();
    context.translate(translateX, translateY);
    context.transform(1, incline, 0, 1, 0, 0);
    if (foreground) {
        saveContext();
        context.fillStyle = foreground;
        context.translate(0, -textHeight + textRect.actualBoundingBoxDescent);
        context.fillRect(0, 0, textWidth, textHeight);
        restoreContext();
    }
    context.fillText(txt, 0, 0);
    restoreContext();
}

let saveCount = 0;

function saveContext() {
    saveCount++;
    context.save();
}

function restoreContext() {
    if (saveCount > 0) {
        saveCount--;
        context.restore();
    }
}

function restoreAllContext() {
    for (;saveCount > 0; saveCount--) {
        context.restore();
    }
}

function withContext(func) {
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

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

function lerpTransform(start, end, amt) {
    start = start.scaleSelf(1 - amt);
    end = end.scaleSelf(amt);
    const final = new DOMMatrix();
    final.a = start.a + end.a;
    final.b = start.b + end.b;
    final.c = start.c + end.c;
    final.d = start.d + end.d;
    final.e = start.e + end.e;
    final.f = start.f + end.f;
    return final;
}

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

function easeInQuint(x) {
    return x * x * x * x * x;
}

(function renderSettings() {
    const settingsDiv = document.getElementById("settings");
    for (const [key, value] of Object.entries(settings)) {
        const settingNode = document.createElement('div');
        const settingName = document.createElement('span');
        settingName.textContent = key;
        const input = document.createElement('input');
        const inputId = `setting_${key}`;
        input.value = value;
        input.id = inputId;
        if (typeof(value) === 'number') {
            input.setAttribute('type', 'number');
            input.addEventListener('change', e => {
                settings[key] = Number(input.value);
            });
        } else if (typeof(value) === 'string') {
            input.setAttribute('type', 'string');
            input.addEventListener('change', e => {
                settings[key] = input.value;
            });
        }
        settingNode.appendChild(settingName);
        settingNode.appendChild(input);
        settingsDiv.appendChild(settingNode);
    }
})();

function updateTime(currentTime) {
    time.last = time.current;
    time.current = currentTime;
    time.delta = time.current - time.last;
}

function nextFrame() {
    requestAnimationFrame(gameLoop);
}

initGame();