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

const HoldingZ = 100;

class CardAnimations {
    static movement = {
        time: 200,
        easeOut: easeOutCubic,
    };

    static getMovementAmt(time) {
        return this.movement.easeOut(time / this.movement.time);
    }

    static animationFinished(time) {
        return this.movement.time <= time;
    }
}

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
    mouse: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
    },
    holdEntity: null,
};

function initGame() {
    const cards = [];
    for (let i = 1; i <= settings.cards; i++) {
        const card = new Card(CardColors.RED, i);
        cards.push(card);
    }
    const cardHand = new CardHand(cards);
    const thrownCards = new ThrownCards();
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

const drawContext = {
    drawZ: []
};

function draw() {
    const {
        cardHand,
        thrownCards,
    } = gameContext;
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);
    withContext(() => {
        thrownCards.x = thrownCardDimensions.x;
        thrownCards.y = thrownCardDimensions.y;
        thrownCards.scale = settings.scale;
        thrownCards.draw();
    });
    cardHand.x = settings.x;
    cardHand.y = settings.y;
    cardHand.scale = settings.scale;
    cardHand.draw();
    drawContext.drawZ.sort((a, b) => a.z - b.z).forEach(x => x.func());
    drawContext.drawZ = [];
}

function drawZ(z, func) {
    const transform = context.getTransform();
    drawContext.drawZ.push({
        z,
        func: () => withContext(() => {
            context.setTransform(transform);
            func();
        }),
    });
}

function handleClick(e) {
    getEntityAt(e.offsetX, e.offsetY)?.handleClick(e);
}

function handleMouseDown(e) {
    getEntityAt(e.offsetX, e.offsetY)?.handleMouseDown(e);
}

function handleMouseUp(e) {
    if (gameContext.holdEntity) return gameContext.holdEntity.handleMouseUp(e);
    // return getEntityAt(e.offsetX, e.offsetY)?.handleMouseUp(e);
}

function handleMouseMove(e) {
    let x = e.offsetX;
    let y = e.offsetY;
    gameContext.mouse.dx = x - gameContext.mouse.x;
    gameContext.mouse.dy = y - gameContext.mouse.y;
    gameContext.mouse.x = x;
    gameContext.mouse.y = y;
    getEntityAt(e.offsetX, e.offsetY)?.handleMouseMove(e);
}

function getEntityAt(x, y) {
    const cardHand = gameContext.cardHand.getEntityAt(x, y);
    if (cardHand) return cardHand;
    const thrownCard = gameContext.thrownCards.getEntityAt(x, y);
    if (thrownCard) return thrownCard;
    return null;
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

    getPosition() {
        return [this.x, this.y];
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
        this.action = null;
    }

    getCardsRadians(numCards) {
        let {
            radius,
            minArcGap,
            arcLength
        } = cardHandDimensions;
        if (numCards === undefined) {
            numCards = this.cards.length;
        }
        if (numCards === 0) {
            return [];
        }
        if (numCards === 1) {
            return [0];
        }
        arcLength = Math.min(minArcGap * (numCards - 1), arcLength);
        const radians = arcLength / radius;
        const gapRadians = radians / (numCards - 1);
        const leftRadians = -radians / 2;
        const cardsRadians = [];
        for (let i = 0; i < numCards; i++) {
            const cardRotation = leftRadians + i * gapRadians;
            cardsRadians.push(cardRotation);
        }
        return cardsRadians;
    }

    forEachEntity(func, args) {
        const {
            excludeHolding,
            restPosition,
        } = args;
        let {
            radius,
        } = cardHandDimensions;
        
        let heldCardIndex = null;
        let cardsRadians = this.getCardsRadians(this.cards.length);
        if (!restPosition && this.action && !CardAnimations.animationFinished(this.action.timePassed)) {
            const amt = CardAnimations.getMovementAmt(time.current - this.action.time);
            let startRadians;
            switch (this.action.type) {
                case 'remove':
                    startRadians = this.getCardsRadians(this.cards.length + 1);
                    startRadians.splice(this.action.index, 1);
                    break;
                case 'move':
                    const from = this.action.from;
                    const to = this.action.to;
                    startRadians = [...cardsRadians];
                    if (from < to) {
                        for (let i = from; i < to; i++) {
                            startRadians[i] = cardsRadians[i+1];
                        }
                    } else {
                        for (let i = to; i < from; i++) {
                           startRadians[i+1] = cardsRadians[i];
                        }
                    }
                    break;
                case 'add':
                    startRadians = this.getCardsRadians(this.cards.length - 1);
                    startRadians.splice(this.action.index, 0, cardsRadians[this.action.index]);
                    break;
            }
            cardsRadians = startRadians
                .map((start, i) => lerp(start, cardsRadians[i], amt));
        }

        saveContext();
        this.contextPrepare();
        forEachContext(this.cards, (card, i) => {
            const holdContext = card.holdContext;
            const cardRotation = cardsRadians[i];

            if (holdContext.isHeld && !restPosition) {
                heldCardIndex = i;
                return;
            }

            context.translate(0, radius);
            context.rotate(cardRotation);
            context.translate(0, -radius);
            if (this.isCardBackInHand(holdContext)) {
                func(card, i);
            } else {
                const amt = CardAnimations.getMovementAmt(holdContext.letGoTimePassed());
                const endTransform = context.getTransform();
                const lerpX = lerp(holdContext.lastHoldX, endTransform.e, amt);
                const lerpY = lerp(holdContext.lastHoldY, endTransform.f, amt);
                const lerpRotation = lerp(0, cardRotation, amt);
                context.setTransform(this.scale, 0, 0, this.scale, lerpX, lerpY);
                context.rotate(lerpRotation);
                func(card, i);
            }
        });

        if (heldCardIndex !== null && !excludeHolding) {
            const transform = context.getTransform();
            transform.e = gameContext.mouse.x;
            transform.f = gameContext.mouse.y;
            context.setTransform(transform);
            drawZ(HoldingZ, () => {
                func(this.cards[heldCardIndex], heldCardIndex);
            });
        }
        restoreContext();
    }

    isCardBackInHand(holdContext) {
        return CardAnimations.animationFinished(holdContext.letGoTimePassed());
    }

    draw() {
        this.forEachEntity(card => card.draw(), {excludeHolding: false});
    }

    getEntityAt(x, y) {
        let finalEntity = null;
        this.forEachEntity(card => {
            if (card.isPointIn(x, y)) {
                finalEntity = card;
            }
        }, {excludeHolding: false});
        return finalEntity;
    }

    removeCard(card) {
        const i = this.cards.indexOf(card);
        this.action = new CardRemove(i);
        this.cards.splice(i, 1);
        return this.lastRemovedCardIndex;
    }

    moveCard(card, moveTo) {
        const i = this.cards.indexOf(card);
        this.action = new CardMove(i, moveTo);
        if (i === moveTo) return;
        this.cards.splice(i, 1);
        this.cards.splice(moveTo, 0, card);
    }

    addCard(card, position) {
        this.action = new CardAdd(position);
        this.cards.splice(position, 0, card);
    }

    getCardsCenterOfRotation() {
        return [0, cardHandDimensions.radius];
    }

    getRelativeRadians(x, y) {
        let [handX, handY] = this.getPosition();
        let [centerX, centerY] = this.getCardsCenterOfRotation();
        const relativeX = handX + centerX - x;
        const relativeY = handY + centerY - y;
        const relativeRadians = Math.atan2(-relativeX, relativeY);
        return relativeRadians;
    }

    getInBetweenCards(x, y) {
        const cardsRadians = this.getCardsRadians();
        const relativeRadians = this.getRelativeRadians(x, y);
        if (relativeRadians <= cardsRadians[0]) {
            return [0];
        }
        if (relativeRadians >= cardsRadians[cardsRadians.length - 1]) {
            return [cardsRadians.length - 1];
        }
        for (let i = 0; i < cardsRadians.length - 1; i++) {
            if (cardsRadians[i] <= relativeRadians && relativeRadians < cardsRadians[i+1]) {
                return [i, i+1];
            }
        }
        throw new Error("unreachable");
    }
}

class CardHandAction {
    constructor() {
        this.time = time.current;
    }

    get timePassed() {
        return time.current - this.time;
    }
}

class CardRemove extends CardHandAction {
    constructor(index) {
        super();
        this.type = 'remove';
        this.index = index;
    }
}

class CardMove extends CardHandAction {
    constructor(from, to) {
        super();
        this.type = 'move';
        this.from = from;
        this.to = to;
    }
}

class CardAdd extends CardHandAction {
    constructor(index) {
        super();
        this.type = 'add';
        this.index = index;
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
        const x = e.offsetX;
        const y = e.offsetY;
        
        const {
            cardHand,
            thrownCards,
        } = gameContext;
        
        
        if (thrownCards.isPointIn(x, y)) {
            cardHand.removeCard(this);
            thrownCards.addCard(this);
        } else {
            const distances = [];
            let index = null;

            cardHand.forEachEntity((card, i) => {
                if (card.isPointIn(x, y)) {
                    index = i + 1;
                    return;
                }
                const transform = context.getTransform();
                const cardX = transform.e;
                const cardY = transform.f;
                const dx = (cardX - x) / cardDimensions.width / 2;
                const dy = (cardY - y) / cardDimensions.height;
                const distSq = dx * dx + dy * dy;
                distances.push({
                    i,
                    value: distSq,
                });
            }, {restPosition: true});
            
            if (index === null) {
                const inBetweenCards = cardHand.getInBetweenCards(x, y);
                const inBetweenIndex = (() => {
                    if (inBetweenCards.length === 1) {
                        if (inBetweenCards[0] === 0) return 0;
                        return inBetweenCards[0];
                    }
                    return inBetweenCards[1];
                })();
                const distanceToCard = distances.find(x => x.i === inBetweenIndex);
                
                const maxDist = 0.75;
                if (distanceToCard) {
                    if (distanceToCard.value < maxDist * maxDist) {
                        index = inBetweenIndex;
                    }
                } else {
                    if (distances[cardHand.cards.length - 1].value < maxDist * maxDist) {
                        index = cardHand.cards.length;
                    }
                }
            }

            if (index !== null) {
                cardHand.moveCard(this, index);
            }
        }

        
        this.holdContext.stopHolding(e);
    }
}

class ThrownCard extends Entity {
    constructor(card, dir) {
        super();
        this.card = card;
        this.devDir = dir + lerp(-Math.PI/3, Math.PI/3, Math.random());
        this.rotated = lerp(-Math.PI/8, Math.PI/8, Math.random());
        this.dev = easeOutCubic(Math.random()) * 20;
    }

    get holdContext() {
        return this.card.holdContext;
    }

    preparePosition() {
        context.rotate(this.devDir);
        context.translate(0, -this.dev);
        context.rotate(this.rotated - this.devDir);
    }

    draw() {
        this.card.draw();
    }

    isPointIn(x, y) {
        return withContext(() => {
            this.preparePosition();
            return this.card.isPointIn(x, y);
        });
    }

    totalRotation() {
        return this.rotated;
    }

    handleMouseDown(e) {
        this.holdContext.startHolding(e, this);
    }

    handleMouseUp(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        const {
            cardHand,
            thrownCards,
        } = gameContext;

        const distances = [];
        
        cardHand.forEachEntity((_, i) => {
            const transform = context.getTransform();
            const cardX = transform.e;
            const cardY = transform.f;
            const dx = (cardX - x) / cardDimensions.width / 2;
            const dy = (cardY - y) / cardDimensions.height;
            const distSq = dx * dx + dy * dy;
            distances.push({
                i,
                value: distSq,
            });
        }, {restPosition: true});
        
        const inBetweenCards = cardHand.getInBetweenCards(x, y);
        const inBetweenIndex = (() => {
            if (inBetweenCards.length === 1) {
                if (inBetweenCards[0] === 0) return 0;
                return inBetweenCards[0] + 1;
            }
            return inBetweenCards[1];
        })();
        const distanceToCard = distances.find(x => x.i === inBetweenIndex);
        
        const maxDist = 0.5;
        let index = null;
        if (distanceToCard) {
            if (distanceToCard.value < maxDist * maxDist) {
                index = inBetweenIndex;
            }
        } else {
            if (distances[cardHand.cards.length - 1].value < maxDist * maxDist) {
                index = cardHand.cards.length;
            }
        }

        if (index !== null) {
            thrownCards.removeCard();
            cardHand.addCard(this.card, index);
        }

        this.holdContext.stopHolding(e);
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
            let heldCard = null;
            forEachContext(this.cards, card => {
                const holdContext = card.holdContext;
                if (holdContext.isHeld) {
                    heldCard = card;
                    return;
                }

                card.preparePosition();
                if (!CardAnimations.animationFinished(holdContext.letGoTimePassed())) {
                    const throwTransform = context.getTransform();

                    let rot = normalizeRadians(card.totalRotation());

                    const animation = animationLerpTransform({
                        startX: holdContext.lastHoldX,
                        startY: holdContext.lastHoldY,
                        endX: throwTransform.e,
                        endY: throwTransform.f,
                        startRot: 0,
                        endRot: rot,
                        amt: CardAnimations.getMovementAmt(holdContext.letGoTimePassed()),
                    });
                    contextSetTransform(animation);
                }
                card.draw();
            });
            if (heldCard) {
                const transform = context.getTransform();
                transform.e = gameContext.mouse.x;
                transform.f = gameContext.mouse.y;
                contextSetTransform(transform);
                drawZ(HoldingZ, () => heldCard.draw());
            }
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
        this.cards.push(new ThrownCard(card, 0));
    }

    getEntityAt(x, y) {
        if (this.cards.length === 0) return null;
        return withContext(() => {
            this.contextPrepare();
            const lastCard = this.cards[this.cards.length - 1];
            if (lastCard && lastCard.isPointIn(x, y)) {
                return lastCard;
            }
            return null;
        });
    }

    removeCard() {
        this.cards.pop();
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
        gameContext.holdEntity = entity;
    }

    stopHolding(e) {
        this.isHeld = false;
        this.lastHold = time.current;
        if (e) {
            this.lastHold = e.timeStamp;
            this.lastHoldX = e.offsetX;
            this.lastHoldY = e.offsetY;
        }
        gameContext.holdEntity = null;
    }
}

function animationLerpTransform(args) {
    const {
        startX,
        startY,
        endX,
        endY,
        startRot,
        endRot,
        amt,            
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

function forEachContext(arr, func) {
    arr.forEach((x, i) => {
        withContext(() => func(x, i));
    });
}

function contextSetTransform(m) {
    context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

function easeInQuint(x) {
    return x * x * x * x * x;
}

function normalizeRadians(x) {
    return x - 2 * Math.PI * Math.floor((x + Math.PI) / 2 / Math.PI);
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