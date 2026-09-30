(() => {
  // public/scripts/consts/gameStep.js
  var GameStep = {
    DRAW: "draw",
    UPDATE: "update",
    HANDLER: "handler"
  };

  // public/scripts/domain/actionError.js
  var ActionError = class extends Error {
    constructor(message) {
      super();
      this.message = message;
    }
  };

  // public/scripts/infrastructure/time.js
  var Time = {
    current: 0,
    delta: 0,
    last: 0
  };
  function updateTime(currentTime) {
    Time.last = Time.current;
    Time.current = currentTime;
    Time.delta = Time.current - Time.last;
  }

  // public/scripts/entities/selectContext.js
  var SelectContext = class _SelectContext {
    static instances = [];
    constructor() {
      this.isSelected = false;
      this.lastChange = Number.NEGATIVE_INFINITY;
      _SelectContext.instances.push(this);
    }
    toggle() {
      this.isSelected = !this.isSelected;
      this.lastChange = Time.current;
    }
    toggleTimePassed() {
      return Time.current - this.lastChange;
    }
    static clearSelections() {
      _SelectContext.instances.forEach((x) => {
        if (x.isSelected) {
          x.isSelected = false;
          x.lastChange = Time.current;
        }
      });
    }
  };

  // public/scripts/consts/colors.js
  var CardColors = {
    RED: "#eb4034",
    GREEN: "#309a42",
    BLUE: "#0071cf",
    YELLOW: "#faee02",
    getAll() {
      return [this.RED, this.BLUE, this.GREEN, this.YELLOW];
    },
    validate(color2) {
      return CardColors[color2] || this.getAll().includes(color2);
    }
  };
  var HoverColors = {
    fill: "rgba(150,150,150,0.45)",
    stroke: "rgba(75,75,75,0.65)",
    lineWidth: 4
  };

  // public/scripts/domain/cardInfo.js
  var CardType = {
    NUMBER: "number",
    BLOCK: "block",
    WILD: "wild"
  };
  var CardInfo = class {
    constructor() {
      this.type = null;
    }
  };
  var NumberCard = class extends CardInfo {
    constructor(number2, color2) {
      super();
      if (number2 < 1 || number2 > 12 || typeof number2 !== "number") {
        throw new Error(`Cannot have card of number ${number2}. Must be between 1 and 12`);
      }
      if (!CardColors.getAll().includes(color2)) {
        if (!CardColors[color2]) {
          throw new Error(`Cannot have color ${color2}. Only RED, BLUE, GREEN & YELLOW`);
        }
        color2 = CardColors[color2];
      }
      this.type = CardType.NUMBER;
      this.number = number2;
      this.color = color2;
    }
    toString() {
      return `NumberCard ${number} ${color}`;
    }
  };
  var BlockCard = class extends CardInfo {
    constructor() {
      super();
      this.type = CardType.BLOCK;
    }
    toString() {
      return "BlockCard";
    }
  };
  var WildCard = class extends CardInfo {
    constructor() {
      super();
      this.type = CardType.WILD;
    }
    toString() {
      return "WildCard";
    }
  };

  // public/scripts/entities/phaseCardAddSide.js
  var PhaseCardAddSide = {
    START: "start",
    END: "end",
    validate(input) {
      if (input === this.START || input === this.END) {
        return;
      }
      throw new Error(`Cannot have PhaseCardAddPosition ${input}`);
    }
  };

  // public/scripts/helpers/mathHelpers.js
  function normalizeRadians(x) {
    return x - 2 * Math.PI * Math.floor((x + Math.PI) / 2 / Math.PI);
  }
  function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  }
  function lerpClamp(start, end, amt) {
    if (amt < 0) amt = 0;
    else if (amt > 1) amt = 1;
    return lerp(start, end, amt);
  }
  function animationLerpTransform(args) {
    const {
      startX,
      startY,
      endX,
      endY,
      startRot,
      endRot,
      amt
    } = args;
    if (Object.values({ startX, startY, endX, endY, startRot, endRot, amt }).some((v) => v === void 0)) {
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
  function shuffleArray(array, seed) {
    const shuffled = [...array];
    const arng = new alea(seed);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const random = Math.abs(arng.int32());
      const j = random % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  function discreteGradient(start, end, n) {
    if (n === 1) {
      return [(end - start) / 2];
    }
    const gap = (end - start) / (n - 1);
    return Array.from({ length: n }, (v, i) => start + gap * i);
  }

  // public/scripts/infrastructure/errorContext.js
  var _ErrorContext = class {
    constructor() {
      this.errorCooldown = null;
      this.errorTime = null;
      this.error = null;
    }
    setActionError(actionError) {
      this.errorCooldown = 5e3;
      this.errorTime = Time.current;
      this.error = actionError.message;
    }
    getCurrentError() {
      if (this.errorCooldown && this.errorTime && this.error) {
        if (Time.current < this.errorTime + this.errorCooldown) {
          return this.error;
        }
      }
      return null;
    }
  };
  function throwActionError(message) {
    if (true) {
      throw new ActionError(message);
    }
  }
  var ErrorContext = new _ErrorContext();

  // public/scripts/domain/phaseGroupTypes.js
  var PhaseGroupType = {
    SET: "set",
    RUN: "run",
    COLOR: "color",
    validate(type) {
      if (type !== this.SET && type !== this.RUN && type !== this.COLOR) {
        throw new Error(`Cannot have PhaseGroupTypes ${type}`);
      }
    }
  };

  // public/scripts/domain/phaseGroup.js
  var PhaseGroup = class {
    constructor(cardInfos, index, type, hint) {
      this.cardInfos = cardInfos;
      this.index = index;
      this.type = type;
      switch (hint) {
        case PhaseGroupType.SET:
          if (typeof hint !== "number" || 1 <= hint && hint <= 12) {
            throw new Error("Wrong hint provided, expected number");
          }
          break;
        case PhaseGroupType.RUN:
          if (typeof hint !== "number" || 1 <= hint && hint <= 12) {
            throw new Error("Wrong hint provided, expected number");
          }
          break;
        case PhaseGroupType.COLOR:
          if (typeof hint !== "string" || CardColors.validate(this)) {
            throw new Error("Wrong hint provided, expected color");
          }
          break;
      }
      this.hint = hint;
    }
    canAddCard(cardInfo) {
      const cardInfos = [...this.cardInfos];
      this.cardInfos.push(cardInfo);
      const result = this.validate();
      this.cardInfos = cardInfos;
      return result;
    }
    addCard(cardInfo) {
      const cardInfos = [...this.cardInfos];
      this.cardInfos.push(cardInfo);
      if (!this.validate()) {
        this.cardInfos = cardInfos;
      }
    }
    validate() {
      throw Error("Abstract class");
      return true;
    }
  };

  // public/scripts/domain/phaseRequirement.js
  var PhaseRequirement = class {
    constructor(type, amount) {
      if (amount < 2 || amount > 10) {
        throw Error(`The Requirement Amount of ${amount} is invalid`);
      }
      if (!PhaseRequirementType[type] && Object.values(PhaseRequirementType).every((x) => x !== type)) {
        throw Error(`Unknown phase requirement type ${type}`);
      } else {
        type = type.toLowerCase();
      }
      this.type = type;
      this.amount = amount;
    }
  };
  var PhaseRequirementType = {
    RUN: "run",
    SET: "set",
    COLOR: "color"
  };

  // public/scripts/services/phaseService.js
  var PhaseService = class _PhaseService {
    constructor() {
      this.phases = 10;
      this.current = 4;
    }
    initialiseGame() {
      this.setPhase(this.current);
    }
    setPhase(phase) {
      if (phase >= this.phases) {
        throwActionError(`Cannot set phase larger than total phases of ${this.phases}`);
      }
      const phaseItems = document.querySelectorAll("#phase-list li");
      phaseItems.forEach((phaseItem) => {
        phaseItem.removeAttribute("class");
      });
      phaseItems.item(phase).setAttribute("class", "current");
    }
    getPhaseRequirements() {
      return phaseRequirements;
    }
    // returns array of PhaseGroup if phase is valid, else returns error message
    groupCardsByPhase(cards) {
      const notEnoughError = "Not enough cards selected";
      const tooManyError = "Too many cards selected";
      const invalidPhaseError = "Cards selected don't make your phase";
      let groupIndex = 0;
      if (cards.some((card) => card.type === CardType.BLOCK)) {
        throwActionError("Cannot make phase out of block cards");
      }
      let wildCards, numberCards, groupedCards, hashSetCards;
      const aggregateCards = () => {
        wildCards = cards.filter((card) => card.type === CardType.WILD).length;
        numberCards = cards.filter((card) => card.type === CardType.NUMBER).sort((a, b) => a.number - b.number);
        hashSetCards = new Set(numberCards.map((x) => x.number));
        groupedCards = Object.entries(Object.groupBy(numberCards, (card) => card.number)).map(([key, values]) => ({ key, values })).sort((a, b) => b.values.length - a.values.length);
      };
      const requirements = _PhaseService.phaseRequirements[this.current];
      const cardsRequired = requirements.reduce((acc, requirement) => acc + requirement.amount, 0);
      if (cardsRequired > cards.length) {
        return notEnoughError;
      } else if (cardsRequired < cards.length) {
        return tooManyError;
      }
      const setRequirements = requirements.filter((requirement) => requirement.type === PhaseRequirementType.SET);
      const runRequirements = requirements.filter((requirement) => requirement.type === PhaseRequirementType.RUN);
      const colorRequirements = requirements.filter((requirement) => requirement.type === PhaseRequirementType.COLOR);
      const phaseGroups = [];
      const removeNCards = (n, func) => {
        if (n === 0) return [];
        const removed = cards.reduce((acc, card) => {
          if (func(card)) acc.push(card);
          return acc;
        }, []).slice(0, n);
        cards = cards.filter((card) => removed.every((x) => x !== card));
        return removed;
      };
      for (const requirement of setRequirements) {
        aggregateCards();
        const cards2 = groupedCards[0].values;
        if (cards2.length + wildCards < requirement.amount) {
          return invalidPhaseError;
        }
        const numberCardsUsed = Math.min(requirement.amount, cards2.length);
        const wildCardsUsed = Math.max(requirement.amount - numberCardsUsed, 0);
        const removedNumberCards = removeNCards(numberCardsUsed, (x) => x.type === CardType.NUMBER && x.number === cards2[0].number);
        const removedWildCards = removeNCards(wildCardsUsed, (x) => x.type === CardType.WILD);
        phaseGroups.push(new PhaseGroup([...removedNumberCards, ...removedWildCards], groupIndex++, PhaseGroupType.SET, cards2[0].number));
      }
      if (runRequirements.length > 1) {
        throw new Error("Cannot handle more than one run requirements");
      }
      for (const requirement of runRequirements) {
        let runSolutionComparer = function(a, b) {
          if (a.wilds < b.wilds) {
            return a;
          }
          if (b.wilds < a.wilds) {
            return b;
          }
          const aWildDist = Math.abs(a.leftWilds - left) + Math.abs(a.rightWilds - right);
          const bWildDist = Math.abs(b.leftWilds - left) + Math.abs(b.rightWilds - right);
          if (aWildDist < bWildDist) {
            return a;
          }
          return b;
        };
        aggregateCards();
        let runSolution = [];
        for (let i = 1; i <= 12 - requirement.amount; i++) {
          let wilds2 = 0;
          let countingLeft = true;
          let leftWilds = 0;
          let rightWilds = 0;
          const cardNumbers2 = [];
          for (let j = 0; j < requirement.amount; j++) {
            if (hashSetCards.has(i + j)) {
              cardNumbers2.push(i + j);
              countingLeft = false;
              rightWilds = 0;
            } else {
              if (countingLeft) {
                leftWilds++;
              }
              wilds2++;
              rightWilds++;
            }
          }
          if (wilds2 > wildCards) {
            continue;
          }
          runSolution.push({
            wilds: wilds2,
            runStart: i,
            cardNumbers: cardNumbers2,
            leftWilds,
            rightWilds
          });
        }
        if (runSolution.length === 0) {
          return invalidPhaseError;
        }
        const {
          left,
          right
        } = cards.reduce((acc, x, i) => {
          if (x.type !== CardType.WILD) {
            return acc;
          }
          if (i < cards.length / 2) {
            acc.left++;
          } else if (i > cards.length / 2) {
            acc.right++;
          }
          return acc;
        }, { left: 0, right: 0 });
        const {
          runStart,
          cardNumbers,
          wilds
        } = runSolution.reduce((acc, x) => {
          if (!acc) return x;
          return runSolutionComparer(acc, x);
        }, null);
        if (wilds > wildCards) {
          return invalidPhaseError;
        }
        const runGroup = [];
        for (let i = runStart; i < requirement.amount + runStart; i++) {
          let card;
          if (cardNumbers.some((x) => x === i)) {
            [card] = removeNCards(1, (x) => x.type === CardType.NUMBER && x.number === i);
          } else {
            [card] = removeNCards(1, (x) => x.type === CardType.WILD);
          }
          runGroup.push(card);
        }
        phaseGroups.push(new PhaseGroup(runGroup, groupIndex++, PhaseGroupType.RUN, runStart));
      }
      if (colorRequirements.length > 1) {
        throw new Error("Cannot handle more than one color requirements");
      }
      if (colorRequirements.length === 1) {
        if (cards.length < colorRequirements.amount) {
          return notEnoughError;
        } else if (cards.length > colorRequirements.amount) {
          return tooManyError;
        }
        const numberCard = cards.find((x) => x.type === CardType.NUMBER);
        const color2 = numberCard?.color;
        const sameColors = cards.every((x) => x.type === CardType.WILD || x.color === color2);
        phaseGroups.push(new PhaseGroup([...cards], groupIndex++, PhaseGroupType.COLOR, color2));
        cards = [];
      }
      if (cards.length > 0) {
        return notEnoughError;
      }
      return phaseGroups;
    }
    // returns array of {start:bool,end:bool} of where it can add that card
    addCardAllowedPositions(phaseGroups, cardInfo) {
      if (cardInfo.type === CardType.BLOCK) {
        return phaseGroups.map(() => {
          return { start: false, end: false };
        });
      }
      return phaseGroups.map((group) => {
        switch (group.type) {
          case PhaseGroupType.SET:
            if (cardInfo.type === CardType.WILD || group.hint === cardInfo.number) {
              return { start: true, end: true };
            }
            return { start: false, end: false };
          case PhaseGroupType.RUN:
            const bounds = { start: false, end: false };
            const runStart = group.hint;
            const runEnd = group.hint + group.cardInfos.length - 1;
            if (runStart > 1) {
              bounds.start = cardInfo.type === CardType.WILD || cardInfo.number === runStart - 1;
            }
            if (runEnd < 12) {
              bounds.end = cardInfo.type === CardType.WILD || cardInfo.number === runEnd + 1;
            }
            return bounds;
          case PhaseGroupType.COLOR:
            if (cardInfo.type === CardType.WILD || group.hint === cardInfo.color) {
              return { start: true, end: true };
            }
            return { start: false, end: false };
        }
      });
    }
    static phaseRequirements = {
      0: [new PhaseRequirement(PhaseRequirementType.SET, 3), new PhaseRequirement(PhaseRequirementType.SET, 3)],
      1: [new PhaseRequirement(PhaseRequirementType.SET, 3), new PhaseRequirement(PhaseRequirementType.RUN, 4)],
      2: [new PhaseRequirement(PhaseRequirementType.SET, 4), new PhaseRequirement(PhaseRequirementType.RUN, 4)],
      3: [new PhaseRequirement(PhaseRequirementType.RUN, 7)],
      4: [new PhaseRequirement(PhaseRequirementType.RUN, 8)],
      5: [new PhaseRequirement(PhaseRequirementType.RUN, 9)],
      6: [new PhaseRequirement(PhaseRequirementType.SET, 4), new PhaseRequirement(PhaseRequirementType.SET, 4)],
      7: [new PhaseRequirement(PhaseRequirementType.COLOR, 7)],
      8: [new PhaseRequirement(PhaseRequirementType.SET, 5), new PhaseRequirement(PhaseRequirementType.SET, 2)],
      9: [new PhaseRequirement(PhaseRequirementType.SET, 5), new PhaseRequirement(PhaseRequirementType.SET, 3)]
    };
  };

  // public/scripts/services/gameService.js
  var GameService = class {
    constructor() {
      this.deck = [];
      this.cardHand = [];
      this.thrownCards = [];
      this.currentPhase = 0;
      this.cardTaken = false;
      this.cardThrown = false;
      this.selectingPhase = false;
      this.phaseService = new PhaseService();
      this.phasePlaced = false;
      this.phaseGroups = null;
    }
    newTurn() {
      this.cardTaken = false;
      this.cardThrown = false;
      this.selectingPhase = false;
    }
    canTakeDeckCard() {
      if (!this.isCurrentPlayerTurn()) {
        throwActionError("Cannot take card, it's not your turn");
      }
      if (this.cardTaken) {
        throwActionError("Cannot take another card");
      }
    }
    takeDeckCard() {
      this.canTakeDeckCard();
      const card = this.deck.pop();
      this.cardHand.push(card);
      this.cardTaken = true;
      return card;
    }
    canTakeThrownCard() {
      this.canTakeDeckCard();
      if (this.thrownCards.length === 0) {
        throwActionError("There are no thrown cards to take");
      }
    }
    takeThrownCard() {
      this.canTakeThrownCard();
      const card = this.thrownCards.pop();
      this.cardHand.push(card);
      this.cardTaken = true;
      return card;
    }
    canThrowCard(card) {
      if (!this.isCurrentPlayerTurn()) {
        throwActionError("Cannot throw card, it's not your turn");
      }
      if (!this.cardHand.some((x) => x === card)) {
        throwActionError("Cannot throw a card that is not in your hand");
      }
      if (!this.cardTaken) {
        throwActionError("Cannot throw card, you should take one first");
      }
    }
    throwCard(card) {
      this.canThrowCard(card);
      this.cardHand = this.cardHand.filter((x) => x !== card);
      this.cardThrown = true;
      this.thrownCards.push(card);
      this.endTurn();
    }
    canEndTurn() {
      if (!this.isCurrentPlayerTurn()) {
        throwActionError("Cannot end turn, it's not your turn");
      }
      if (!this.cardTaken) {
        throwActionError("Cannot end turn, you must take a card first");
      }
      if (!this.cardThrown) {
        throwActionError("Cannot end turn, you must throw away a card");
      }
    }
    endTurn() {
      this.canEndTurn();
      this.newTurn();
    }
    isCurrentPlayerTurn() {
      return true;
    }
    initialiseDeck(seed) {
      this.generateDeck();
      this.shuffleDeck(seed);
    }
    setFirstCard() {
      const card = this.deck.pop();
      if (card) {
        this.thrownCards.push(card);
      }
    }
    initialiseGame(seed) {
      this.initialiseDeck(seed);
      this.setFirstCard();
      this.phaseService.initialiseGame();
    }
    generateDeck() {
      const numbered = [];
      for (let i = 1; i <= 12; i++) {
        CardColors.getAll().forEach((color2) => {
          numbered.push(new NumberCard(i, color2));
          numbered.push(new NumberCard(i, color2));
        });
      }
      const wildCards = Array.from({ length: 8 }, () => new WildCard());
      const blockCards = Array.from({ length: 4 }, () => new BlockCard());
      this.deck = [...numbered, ...wildCards, ...blockCards];
    }
    shuffleDeck(seed) {
      this.deck = shuffleArray(this.deck, seed);
    }
    takeHand() {
      if (this.deck.length < 10) {
        const deck = this.deck;
        this.deck = [];
        return deck;
      }
      this.cardHand = Array.from({ length: 10 }, () => this.deck.pop());
      return this.cardHand;
    }
    toggleSelectPhase() {
      if (!this.cardTaken) {
        throwActionError("Cannot select phase, you must take a card first");
      }
      if (this.phasePlaced) {
        throwActionError("Cannot select phase, you already placed it");
      }
      this.selectingPhase = !this.selectingPhase;
      return this.selectingPhase;
    }
    placePhase(cards) {
      if (this.phasePlaced) {
        throwActionError("Cannot place phase, you already placed it");
      }
      const phaseGroups = this.phaseService.groupCardsByPhase(cards);
      if (typeof phaseGroups === "string") {
        throwActionError(phaseGroups);
      }
      this.phaseGroups = phaseGroups;
      this.phasePlaced = true;
      this.selectingPhase = false;
      return phaseGroups;
    }
    addPhaseCard(card, groupIndex, side) {
      const allowedPositions = this.phaseService.addCardAllowedPositions(this.phaseGroups, card);
      if (!allowedPositions[groupIndex][side]) {
        throwActionError(`Cannot add phase card ${card} to group ${groupIndex} on side ${side}`);
      }
      const phaseGroup = this.phaseGroups[groupIndex];
      if (side === PhaseCardAddSide.START) {
        phaseGroup.cardInfos.unshift(card);
      } else if (side === PhaseCardAddSide.END) {
        phaseGroup.cardInfos.push(card);
      }
      return this.phaseGroups;
    }
  };

  // public/scripts/infrastructure/domController.js
  var DomController = class {
    static selectPhaseId = "select-phase";
    static placePhaseId = "place-phase";
    static getSelectPhaseButton() {
      return document.getElementById(this.selectPhaseId);
    }
    static getPlacePhaseButton() {
      return document.getElementById(this.placePhaseId);
    }
    static checkSelectPhaseButton(checked) {
      if (checked) {
        this.getSelectPhaseButton().setAttribute("checked", "");
        this.getPlacePhaseButton().removeAttribute("disabled");
      } else {
        this.getSelectPhaseButton().removeAttribute("checked");
        this.getPlacePhaseButton().setAttribute("disabled", "");
      }
    }
  };

  // public/scripts/infrastructure/gameCanvas.js
  var GameCanvas = document.getElementById("game-canvas");
  GameCanvas.area = () => {
    return GameCanvas.getAttribute("width") * GameCanvas.getAttribute("height");
  };
  GameCanvas.scale = () => {
    const scale = Math.sqrt(GameCanvas.area() / screen.availHeight / screen.availWidth);
    return 1;
  };
  function setCanvasDimensions() {
    GameCanvas.setAttribute("width", innerWidth - 200);
    GameCanvas.setAttribute("height", innerHeight);
  }
  setCanvasDimensions();
  addEventListener("resize", setCanvasDimensions);

  // public/scripts/consts/dimensions.js
  var CardDimensions = class {
    static height = 350;
    static width = 225;
    static fontSize = 212;
    static radius = 18;
    static accent = 65;
    static accentRadius = 12;
    static incline = -0.1;
    static margin = 11;
    static get scale() {
      return CardHandDimensions.maxWidth / 750 / 2 * 0.8;
    }
    static rainbowGap = 10;
    static starOffsetY = 10;
    static starOuterRadius = 112;
    static starInnerRadius = 40;
    static starForegroundRatio = 0.78;
    static blockRadius = 65;
    static blockCircleWidth = 52;
    static blockLineWidth = 45;
    static blockMargin = 14;
    static get selectOffset() {
      return this.height / 3 * this.scale;
    }
    static numberCard = {
      leftCornerX: 45,
      leftCornerY: 42,
      leftCornerScale: 0.3,
      rightCornerX: 38,
      rightCornerY: 36,
      rightCornerScale: 0.22
    };
    static starCard = {
      leftCornerX: 42,
      leftCornerY: 38,
      leftCornerScale: 0.23,
      rightCornerX: 38,
      rightCornerY: 42,
      rightCornerScale: 0.18
    };
    static blockCard = {
      leftCornerX: 42,
      leftCornerY: 36,
      leftCornerScale: 0.28,
      rightCornerX: 38,
      rightCornerY: 42,
      rightCornerScale: 0.2
    };
  };
  var CardHandDimensions = class {
    static get radius() {
      const { width, height, scale } = this;
      return width * width / 8 / height + height / 2;
    }
    static get arcRadians() {
      const { width, radius } = this;
      return 2 * Math.asin(width / 2 / radius);
    }
    static get arcLength() {
      return this.arcRadians * this.radius;
    }
    static get minArcGap() {
      return 80 * this.scale;
    }
    static get scale() {
      return 1;
    }
    static get x() {
      return GameCanvas.width / 2;
    }
    static get y() {
      return GameCanvas.height * Math.max(0.82, lerp(1, 0.82, this.width / 650 / devicePixelRatio));
    }
    static maxWidth = 750;
    static get width() {
      return Math.min(GameCanvas.width * 0.8, this.maxWidth);
    }
    static get height() {
      return Math.min(this.width / 8, this.width * this.width / this.maxWidth / this.maxWidth * 50);
    }
  };
  var ThrownCardsDimensions = class {
    static get size() {
      return Math.max(CardHandDimensions.width * 0.4);
    }
    static get x() {
      return GameCanvas.width / 2;
    }
    static get y() {
      return GameCanvas.height * Math.max(0.4, lerpClamp(0.7, 0.4, CardHandDimensions.width / 650 / devicePixelRatio));
    }
    static get scale() {
      return 1;
    }
    static maxPickupRatio = 0.65;
  };
  var CardDeckDimensions = class {
    static get x() {
      return 0.9 * GameCanvas.width;
    }
    static get y() {
      return GameCanvas.height * Math.max(0.6, lerpClamp(0.9, 0.6, CardHandDimensions.width / 650 / devicePixelRatio));
    }
    static get scale() {
      return 1;
    }
  };
  var PhaseCardsDimensions = class {
    static get x() {
      return GameCanvas.width / 2;
    }
    static get y() {
      return (CardHandDimensions.y + ThrownCardsDimensions.y + (ThrownCardsDimensions.size - CardDimensions.height * CardDimensions.scale) / 2) / 2;
    }
    static get width() {
      return CardHandDimensions.width * 0.7 - CardDimensions.width * CardDimensions.scale;
    }
    static minCardGap = 100;
    static get minGroupGap() {
      return 2.2 * CardDimensions.width * CardDimensions.scale;
    }
    static groupGapWeight = 1.5;
  };

  // public/scripts/infrastructure/drawContext.js
  var DrawContext = GameCanvas.getContext("2d");
  DrawContext.drawZ = [];
  function contextSetTransform(m) {
    DrawContext.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  }
  function forEachContext(arr, func) {
    arr.forEach((x, i) => {
      withContext(() => func(x, i));
    });
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
  function clearContextPreserveTranslation() {
    const context = DrawContext.getTransform();
    context.a = 1;
    context.b = 0;
    context.c = 0;
    context.d = 1;
    contextSetTransform(context);
  }
  var saveCount = 0;
  function saveContext() {
    saveCount++;
    DrawContext.save();
  }
  function restoreContext() {
    if (saveCount > 0) {
      saveCount--;
      DrawContext.restore();
    }
  }
  function restoreAllContext() {
    for (; saveCount > 0; saveCount--) {
      DrawContext.restore();
    }
  }
  function getTranslation() {
    const transform = DrawContext.getTransform();
    return {
      x: transform.e,
      y: transform.f
    };
  }

  // public/scripts/helpers/drawHelpers.js
  function drawTextInCenter(txt, x, y, width, height, args) {
    args ??= {};
    let {
      incline,
      foreground
    } = args;
    if (!incline) incline = 0;
    txt = txt.toString();
    const textRect = DrawContext.measureText(txt);
    const textWidth = textRect.width;
    const textRightYOffset = incline * textWidth;
    const textHeight = textRect.actualBoundingBoxAscent + textRect.actualBoundingBoxDescent;
    const translateX = x + (width - textWidth) / 2;
    const translateY = y + (height + textHeight - textRightYOffset) / 2 - textRect.actualBoundingBoxDescent;
    saveContext();
    DrawContext.translate(translateX, translateY);
    DrawContext.transform(1, incline, 0, 1, 0, 0);
    if (foreground) {
      saveContext();
      DrawContext.fillStyle = foreground;
      DrawContext.translate(0, -textHeight + textRect.actualBoundingBoxDescent);
      DrawContext.fillRect(0, 0, textWidth, textHeight);
      restoreContext();
    }
    DrawContext.fillText(txt, 0, 0);
    restoreContext();
  }
  function drawZ(z, func) {
    const transform = DrawContext.getTransform();
    const drawZJob = {
      z,
      executed: false,
      func: (z2) => {
        if (!drawZJob.executed) {
          withContext(() => {
            DrawContext.setTransform(transform);
            func();
          });
          drawZJob.executed = true;
        }
      }
    };
    if (GameContext.step === GameStep.HANDLER) {
      drawZJob.func();
    } else {
      DrawContext.drawZ.push(drawZJob);
    }
    return drawZJob;
  }
  function drawDebug(func) {
    if (0) {
      drawZ(101, () => {
        withContext(() => {
          DrawContext.fillStyle = DrawContext.strokeStyle = "magenta";
          func();
        });
      });
    }
  }

  // public/scripts/infrastructure/holdContext.js
  var HoldContext = {
    holdEntity: null,
    startHold: Number.NEGATIVE_INFINITY,
    startHoldX: 0,
    startHoldY: 0,
    lastHoldEntity: null,
    lastHold: Number.NEGATIVE_INFINITY,
    lastHoldX: 0,
    lastHoldY: 0,
    scale: 1,
    letGoTimePassed(entity) {
      if (this.isLastHolding(entity)) {
        return Time.current - this.lastHold;
      }
      return Number.POSITIVE_INFINITY;
    },
    startHolding(e, entity) {
      this.startHold = e.timeStamp;
      this.startHoldX = e.offsetX;
      this.startHoldY = e.offsetY;
      this.holdEntity = entity;
    },
    swapHolding(entity) {
      this.holdEntity = entity;
    },
    stopHolding(e) {
      this.lastHold = Time.current;
      if (e) {
        this.lastHold = e.timeStamp;
        this.lastHoldX = e.offsetX;
        this.lastHoldY = e.offsetY;
      }
      this.lastHoldEntity = this.holdEntity;
      this.holdEntity = null;
    },
    isHolding(entity) {
      return this.holdEntity === entity;
    },
    isLastHolding(entity) {
      return this.lastHoldEntity === entity;
    },
    draw() {
      if (this.holdEntity) {
        const transform = DrawContext.getTransform();
        transform.e = GameContext.mouse.x;
        transform.f = GameContext.mouse.y;
        DrawContext.setTransform(transform);
        DrawContext.scale(this.scale, this.scale);
        this.holdEntity.draw();
        this.scale = 1;
      }
    },
    handleMouseUp(e) {
      this.holdEntity?.handleMouseUp(e);
    }
  };

  // public/scripts/entities/entity.js
  var Entity = class {
    constructor() {
    }
    get x() {
      return 0;
    }
    get y() {
      return 0;
    }
    get scale() {
      return 1;
    }
    draw() {
    }
    contextPrepare() {
      DrawContext.translate(this.x, this.y);
      DrawContext.scale(this.scale, this.scale);
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
    handleClick(e) {
    }
    handleMouseDown(e) {
    }
    handleMouseMove(e) {
    }
    handleMouseUp(e) {
    }
  };

  // public/scripts/entities/card.js
  var Card = class _Card extends Entity {
    constructor(cardInfo) {
      super();
      this.info = cardInfo;
      this.isNew = false;
      this.selectContext = new SelectContext();
    }
    static Prototype = new _Card(null);
    get scale() {
      return CardDimensions.scale;
    }
    static drawStatic(cardInfo) {
      this.Prototype.info = cardInfo;
      this.Prototype.draw();
    }
    static drawDebug(x, y, args) {
      const { width, height, radius } = CardDimensions;
      let {
        withCenter
      } = args ?? {};
      if (withCenter === void 0) {
        withCenter = true;
      }
      if (withCenter) {
        DrawContext.beginPath();
        DrawContext.arc(0, 0, 10, 0, 2 * Math.PI);
        DrawContext.fill();
      }
      DrawContext.beginPath();
      DrawContext.roundRect(x - width / 2, y - height / 2, width, height, radius);
      DrawContext.stroke();
    }
    draw() {
      withContext(() => {
        this.contextPrepare();
        drawDebug(() => _Card.drawDebug(0, 0));
        switch (this.info.type) {
          case CardType.NUMBER:
            drawNumberCard(this.info.number, this.info.color);
            break;
          case CardType.WILD:
            drawWildCard();
            break;
          case CardType.BLOCK:
            drawBlockCard();
            break;
          default:
            throw new Error(`Card type ${this.info.type} doesn't exist`);
        }
      });
    }
    static drawBack() {
      withContext(() => {
        _Card.drawOutline("black", "black");
      });
    }
    isPointIn(x, y) {
      const {
        width,
        height,
        radius
      } = CardDimensions;
      return withContext(() => {
        this.contextPrepare();
        DrawContext.translate(-CardDimensions.width / 2, -CardDimensions.height / 2);
        DrawContext.beginPath();
        DrawContext.roundRect(0, 0, width, height, radius);
        return DrawContext.isPointInPath(x, y);
      });
    }
    handleMouseDown(e) {
      const gameService = GameContext.gameService;
      if (gameService.selectingPhase) {
        if (this.info.type === CardType.BLOCK) {
          throwActionError("Cannot use block card for a phase");
        }
        this.selectContext.toggle();
      } else {
        HoldContext.startHolding(e, this);
      }
    }
    handleMouseUp(e) {
      const x = e.offsetX;
      const y = e.offsetY;
      const {
        cardHand,
        thrownCards,
        phaseCards
      } = GameContext.entities;
      try {
        if (thrownCards.isPointIn(x, y)) {
          GameContext.gameService.throwCard(this.info);
          cardHand.removeCard(this);
          HoldContext.swapHolding(thrownCards.addCard(this));
        } else if (phaseCards.isPointIn(x, y)) {
          if (phaseCards.addPhaseCard(this.info, x, y)) {
            cardHand.removeCard(this);
          }
        } else {
          const distances = [];
          const cardIndex = cardHand.getCardIndex(this);
          let index = null;
          cardHand.forEachEntity((card, i) => {
            if (card.isPointIn(x, y)) {
              if (i < cardIndex || this.isNew) {
                index = i + 1;
              } else {
                index = i;
              }
              return;
            }
            const transform = DrawContext.getTransform();
            const cardX = transform.e;
            const cardY = transform.f;
            const dx = (cardX - x) / CardDimensions.width / 2;
            const dy = (cardY - y) / CardDimensions.height;
            const distSq = dx * dx + dy * dy;
            distances.push({
              i,
              value: distSq
            });
          }, { restPosition: true });
          if (index === null) {
            const inBetweenCards = cardHand.getInBetweenCards(x, y);
            const inBetweenIndex = (() => {
              if (inBetweenCards.length === 1) {
                if (inBetweenCards[0] === 0) return 0;
                let i = inBetweenCards[0];
                if (this.isNew) {
                  i++;
                }
                return i;
              }
              return inBetweenCards[1];
            })();
            const distanceToCard = distances.find((x2) => x2.i === inBetweenIndex);
            const maxDist = 0.75;
            if (distanceToCard) {
              if (distanceToCard.value < maxDist * maxDist || this.isNew) {
                index = inBetweenIndex;
              }
            } else {
              if (distances[cardHand.cards.length - 1].value < maxDist * maxDist || this.isNew) {
                index = cardHand.cards.length;
              }
            }
          }
          if (index !== null) {
            if (this.isNew) {
              cardHand.addCard(this, index);
              this.isNew = false;
            } else {
              cardHand.moveCard(this, index);
            }
          }
        }
      } finally {
        HoldContext.stopHolding(e);
      }
    }
    static drawPath() {
      const {
        width,
        height,
        radius
      } = CardDimensions;
      DrawContext.translate(-width / 2, -height / 2);
      DrawContext.beginPath();
      DrawContext.roundRect(0, 0, width, height, radius);
    }
    static drawOutline(fillStyle, strokeStyle, lineWidth) {
      const {
        width,
        height,
        radius
      } = CardDimensions;
      _Card.drawPath();
      DrawContext.fillStyle = fillStyle;
      DrawContext.lineWidth = lineWidth ?? 2;
      DrawContext.strokeStyle = strokeStyle;
      DrawContext.fill();
      DrawContext.stroke();
    }
  };
  function drawCardBackground(color2) {
    const {
      width,
      height,
      radius,
      margin,
      incline,
      accent,
      accentRadius
    } = CardDimensions;
    Card.drawOutline("white", "gray");
    DrawContext.beginPath();
    DrawContext.translate(margin, margin);
    DrawContext.scale(1 - 2 * margin / width, 1 - 2 * margin / height);
    DrawContext.roundRect(0, 0, width, height, accentRadius);
    DrawContext.fillStyle = color2;
    DrawContext.fill();
    DrawContext.fillStyle = "white";
    DrawContext.transform(1, incline, 0, 1, 0, accent - (width * incline + margin) / 2);
    const insideHeight = height - 2 * accent + margin;
    DrawContext.fillRect(-margin / 2, 0, width + margin, insideHeight);
    return insideHeight;
  }
  function drawCardRainbow(insideHeight) {
    const {
      width,
      height,
      margin,
      accent,
      rainbowGap
    } = CardDimensions;
    const rowHeight = (insideHeight - 5 * rainbowGap) / 4;
    const colors = CardColors.getAll();
    for (let i = 0; i < 4; i++) {
      DrawContext.fillStyle = colors[i];
      DrawContext.fillRect(0, rainbowGap + i * (rainbowGap + rowHeight), width, rowHeight);
    }
  }
  function drawCorners(drawSymbol, cornerDimensions) {
    const {
      numberCard,
      width,
      height
    } = CardDimensions;
    const {
      leftCornerScale,
      leftCornerX,
      leftCornerY,
      rightCornerScale,
      rightCornerX,
      rightCornerY
    } = cornerDimensions;
    const drawTopCorners = () => withContext(() => {
      DrawContext.translate(-width / 2, -height / 2);
      withContext(() => {
        DrawContext.translate(leftCornerX, leftCornerY);
        DrawContext.scale(leftCornerScale, leftCornerScale);
        drawSymbol();
      });
      withContext(() => {
        DrawContext.translate(width - rightCornerX, rightCornerY);
        DrawContext.scale(rightCornerScale, rightCornerScale);
        drawSymbol();
      });
    });
    withContext(() => {
      drawTopCorners();
      DrawContext.rotate(Math.PI);
      drawTopCorners();
    });
  }
  function drawNumberCard(number2, color2) {
    const {
      width,
      height,
      accent,
      margin,
      fontSize,
      incline,
      numberCard
    } = CardDimensions;
    DrawContext.font = `${fontSize}px Georgia`;
    withContext(() => {
      const insideHeight = drawCardBackground(color2);
      DrawContext.fillStyle = color2;
      drawTextInCenter(number2.toString(), 0, 0, width, insideHeight);
    });
    DrawContext.fillStyle = "white";
    drawCorners(() => {
      drawTextInCenter(number2.toString(), 0, 0, 0, 0, { incline });
    }, numberCard);
  }
  function drawWildCard() {
    const {
      width,
      height,
      radius,
      margin,
      incline,
      fontSize,
      accent,
      accentRadius,
      starOuterRadius,
      starInnerRadius,
      starForegroundRatio,
      starOffsetY,
      starCard
    } = CardDimensions;
    withContext(() => {
      const insideHeight = drawCardBackground("black");
      drawCardRainbow(insideHeight);
      const starY = insideHeight / 2 + starOffsetY;
      const starX = width / 2;
      drawStar(starX, starY, starOuterRadius, starInnerRadius, "white");
      drawStar(
        starX,
        starY,
        starOuterRadius * starForegroundRatio,
        starInnerRadius * starForegroundRatio,
        "black"
      );
    });
    DrawContext.transform(1, incline, 0, 1, 0, 0);
    drawCorners(() => {
      drawStar(0, 0, starOuterRadius, starInnerRadius, "white");
    }, starCard);
  }
  function drawStar(x, y, outerRadius, innerRadius, color2) {
    withContext(() => {
      DrawContext.translate(x, y);
      DrawContext.beginPath();
      DrawContext.moveTo(0, -outerRadius);
      for (let i = 0; i < 5; i++) {
        DrawContext.lineTo(0, -outerRadius);
        DrawContext.rotate(2 * Math.PI / 10);
        DrawContext.lineTo(0, -innerRadius);
        DrawContext.rotate(2 * Math.PI / 10);
      }
      DrawContext.fillStyle = color2;
      DrawContext.closePath();
      DrawContext.fill();
    });
  }
  function drawBlockCard() {
    const {
      width,
      height,
      radius,
      margin,
      incline,
      fontSize,
      accent,
      accentRadius,
      blockCircleWidth,
      blockLineWidth,
      blockMargin,
      blockCard
    } = CardDimensions;
    withContext(() => {
      const insideHeight = drawCardBackground("black");
      drawCardRainbow(insideHeight);
      DrawContext.translate(width / 2, insideHeight / 2);
      drawBlockCircle("white", blockCircleWidth);
      drawBlockLine("white", blockLineWidth);
      drawBlockCircle("black", blockCircleWidth - blockMargin);
      drawBlockLine("black", blockLineWidth - blockMargin);
    });
    DrawContext.transform(1, incline, 0, 1, 0, 0);
    drawCorners(() => {
      drawBlockCircle("white", blockCircleWidth - blockMargin);
      drawBlockLine("white", blockLineWidth - blockMargin);
    }, blockCard);
  }
  function drawBlockCircle(color2, lineWidth) {
    withContext(() => {
      const blockRadius = CardDimensions.blockRadius;
      DrawContext.beginPath();
      DrawContext.rotate(Math.PI / 4);
      DrawContext.moveTo(0, -blockRadius);
      DrawContext.rotate(Math.PI);
      DrawContext.lineTo(0, -blockRadius);
      DrawContext.lineWidth = lineWidth;
      DrawContext.strokeStyle = color2;
      DrawContext.stroke();
    });
  }
  function drawBlockLine(color2, lineWidth) {
    DrawContext.beginPath();
    DrawContext.arc(0, 0, CardDimensions.blockRadius, 0, 2 * Math.PI, false);
    DrawContext.lineWidth = lineWidth;
    DrawContext.strokeStyle = color2;
    DrawContext.stroke();
  }

  // public/scripts/entities/action.js
  var Action = class {
    constructor() {
      this.time = Time.current;
    }
    get timePassed() {
      return Time.current - this.time;
    }
  };

  // public/scripts/entities/cardHandAction.js
  var CardHandAction = class extends Action {
  };
  var CardRemove = class extends CardHandAction {
    constructor(index) {
      super();
      this.type = "remove";
      this.index = index;
    }
  };
  var CardMove = class extends CardHandAction {
    constructor(from, to) {
      super();
      this.type = "move";
      this.from = from;
      this.to = to;
    }
  };
  var CardAdd = class extends CardHandAction {
    constructor(index) {
      super();
      this.type = "add";
      this.index = index;
    }
  };
  var CardPlacePhase = class extends CardHandAction {
    constructor(remainingIndices, hadCards) {
      super();
      this.type = "placePhase";
      this.remainingIndices = remainingIndices;
      this.hadCards = hadCards;
    }
  };

  // public/scripts/consts/animations.js
  var CardAnimations = class {
    static movement = {
      time: 300,
      easeOut: easeOutCubic
    };
    static getMovementAmt(time) {
      return this.movement.easeOut(time / this.movement.time);
    }
    static animationFinished(time) {
      return this.movement.time <= time;
    }
  };
  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  // public/scripts/entities/cardHand.js
  var CardHand = class extends Entity {
    constructor(cards) {
      super();
      this.cards = cards;
      this.action = null;
    }
    get x() {
      return CardHandDimensions.x;
    }
    get y() {
      return CardHandDimensions.y;
    }
    get scale() {
      return CardHandDimensions.scale;
    }
    getCardsRadians(numCards) {
      let {
        radius,
        minArcGap,
        arcLength
      } = CardHandDimensions;
      if (numCards === void 0) {
        numCards = this.cards.length;
      }
      if (numCards === 0) {
        return [];
      }
      arcLength = Math.min(minArcGap * (numCards - 1), arcLength);
      const radians = arcLength / radius;
      return discreteGradient(-radians / 2, radians / 2, numCards);
    }
    getCardsActionRadians(restPosition) {
      let cardsRadians = this.getCardsRadians(this.cards.length);
      if (!restPosition && this.action && !CardAnimations.animationFinished(this.action.timePassed)) {
        const amt = CardAnimations.getMovementAmt(Time.current - this.action.time);
        let startRadians;
        switch (this.action.type) {
          case "remove":
            startRadians = this.getCardsRadians(this.cards.length + 1);
            startRadians.splice(this.action.index, 1);
            break;
          case "move":
            const from = this.action.from;
            const to = this.action.to;
            startRadians = [...cardsRadians];
            if (from < to) {
              for (let i = from; i < to; i++) {
                startRadians[i] = cardsRadians[i + 1];
              }
            } else {
              for (let i = to; i < from; i++) {
                startRadians[i + 1] = cardsRadians[i];
              }
            }
            break;
          case "add":
            startRadians = this.getCardsRadians(this.cards.length - 1);
            startRadians.splice(this.action.index, 0, cardsRadians[this.action.index]);
            break;
          case "placePhase":
            startRadians = this.getCardsRadians(this.action.hadCards).filter((_, i) => this.action.remainingIndices.includes(i));
            break;
        }
        cardsRadians = startRadians.map((start, i) => lerp(start, cardsRadians[i], amt));
      }
      return cardsRadians;
    }
    forEachEntity(func, args) {
      const {
        excludeHolding,
        restPosition
      } = args ?? {};
      let {
        radius
      } = CardHandDimensions;
      const cardsRadians = this.getCardsActionRadians(restPosition);
      withContext(() => {
        this.contextPrepare();
        let drawZJob = null;
        forEachContext(this.cards, (card, i) => {
          const cardRotation = cardsRadians[i];
          if (HoldContext.isHolding(card) && !restPosition) {
            HoldContext.scale = this.scale;
            return;
          }
          DrawContext.translate(0, radius / this.scale);
          DrawContext.rotate(cardRotation);
          DrawContext.translate(0, -radius / this.scale);
          const selectContext = card.selectContext;
          let selectOffset = 0;
          if (!CardAnimations.animationFinished(selectContext.toggleTimePassed())) {
            const amt = CardAnimations.getMovementAmt(selectContext.toggleTimePassed());
            if (selectContext.isSelected) {
              selectOffset = lerp(0, CardDimensions.selectOffset, amt);
            } else {
              selectOffset = lerp(CardDimensions.selectOffset, 0, amt);
            }
          } else if (selectContext.isSelected) {
            selectOffset = CardDimensions.selectOffset;
          }
          DrawContext.translate(0, -selectOffset);
          if (this.isCardBackInHand(card)) {
            func(card, i, { ...getTranslation(), rotation: cardRotation });
          } else {
            drawZJob = drawZ(1, () => {
              const amt = CardAnimations.getMovementAmt(HoldContext.letGoTimePassed(card));
              const endTransform = DrawContext.getTransform();
              const lerpX = lerp(HoldContext.lastHoldX, endTransform.e, amt);
              const lerpY = lerp(HoldContext.lastHoldY, endTransform.f, amt);
              const lerpRotation = lerp(0, cardRotation, amt);
              DrawContext.setTransform(this.scale, 0, 0, this.scale, lerpX, lerpY);
              DrawContext.rotate(lerpRotation);
              func(card, i, { ...getTranslation(), rotation: cardRotation });
            });
          }
        });
        drawZJob?.func();
      });
    }
    isCardBackInHand(card) {
      return CardAnimations.animationFinished(HoldContext.letGoTimePassed(card));
    }
    draw() {
      drawDebug(() => {
        this.contextPrepare();
        clearContextPreserveTranslation();
        DrawContext.beginPath();
        DrawContext.arc(0, 0, 10, 0, 2 * Math.PI);
        DrawContext.fill();
        DrawContext.strokeRect(-CardHandDimensions.width / 2, 0, CardHandDimensions.width, CardHandDimensions.height);
        DrawContext.beginPath();
        DrawContext.arc(
          0,
          CardHandDimensions.radius,
          CardHandDimensions.radius,
          (-Math.PI - CardHandDimensions.arcRadians) / 2,
          (-Math.PI + CardHandDimensions.arcRadians) / 2
        );
        DrawContext.stroke();
      });
      this.forEachEntity((card) => card.draw(), { excludeHolding: false });
    }
    getEntityAt(x, y) {
      let finalEntity = null;
      this.forEachEntity((card) => {
        if (card.isPointIn(x, y)) {
          finalEntity = card;
        }
      }, { excludeHolding: false });
      return finalEntity;
    }
    removeCard(card) {
      const i = this.getCardIndex(card);
      this.action = new CardRemove(i);
      this.cards.splice(i, 1);
      return this.lastRemovedCardIndex;
    }
    moveCard(card, moveTo) {
      const i = this.getCardIndex(card);
      this.action = new CardMove(i, moveTo);
      if (i === moveTo) return;
      this.cards.splice(i, 1);
      this.cards.splice(moveTo, 0, card);
    }
    addCard(card, position) {
      this.action = new CardAdd(position);
      this.cards.splice(position, 0, card);
      return card;
    }
    placePhase() {
      const remainingIndices = this.cards.map((card, i) => card.selectContext.isSelected ? -1 : i).filter((i) => i !== -1);
      this.action = new CardPlacePhase(remainingIndices, this.cards.length);
      this.cards = this.cards.filter((card) => !card.selectContext.isSelected);
    }
    getCardsCenterOfRotation() {
      return [0, CardHandDimensions.radius];
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
      if (cardsRadians.length === 0) {
        return 0;
      }
      const relativeRadians = this.getRelativeRadians(x, y);
      if (relativeRadians <= cardsRadians[0]) {
        return [0];
      }
      if (relativeRadians >= cardsRadians[cardsRadians.length - 1]) {
        return [cardsRadians.length - 1];
      }
      for (let i = 0; i < cardsRadians.length - 1; i++) {
        if (cardsRadians[i] <= relativeRadians && relativeRadians < cardsRadians[i + 1]) {
          return [i, i + 1];
        }
      }
      throw new Error("unreachable");
    }
    getCardIndex(card) {
      return this.cards.indexOf(card);
    }
    getCardEntitiesPositions() {
      const cardPositions = [];
      this.forEachEntity((card, i, positions) => {
        cardPositions.push({ card, ...positions });
      });
      return cardPositions;
    }
  };

  // public/scripts/entities/thrownCard.js
  var ThrownCard = class extends Entity {
    constructor(card, dir) {
      super();
      this.card = card;
      if (dir !== void 0) {
        this.rotated = lerp(-Math.PI / 8, Math.PI / 8, Math.random());
        this.devDir = dir + lerp(-Math.PI / 3, Math.PI / 3, Math.random());
        this.dev = easeOutCubic(Math.random()) * 20;
      } else {
        this.rotated = 0;
        this.devDir = 0;
        this.dev = 0;
      }
    }
    preparePosition() {
      DrawContext.rotate(this.devDir);
      DrawContext.translate(0, -this.dev);
      DrawContext.rotate(this.rotated - this.devDir);
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
      HoldContext.startHolding(e, this);
    }
    handleMouseUp(e) {
      const x = e.offsetX;
      const y = e.offsetY;
      const {
        cardHand,
        thrownCards
      } = GameContext.entities;
      try {
        let index = null;
        if (thrownCards.isPointIn(x, y)) {
        } else if (cardHand.cards.length === 0) {
          const dx = x - cardHand.x;
          const dy = y - cardHand.y;
          if (dx * dx + dy * dy < 300 * 300) {
            index = 0;
          }
        } else {
          const distances = [];
          cardHand.forEachEntity((card, i) => {
            if (card.isPointIn(x, y)) {
              index = i + 1;
              return;
            }
            const transform = DrawContext.getTransform();
            const cardX = transform.e;
            const cardY = transform.f;
            const dx = (cardX - x) / CardDimensions.width / 2;
            const dy = (cardY - y) / CardDimensions.height;
            const distSq = dx * dx + dy * dy;
            distances.push({
              i,
              value: distSq
            });
          }, { restPosition: true });
          if (index === null) {
            const inBetweenCards = cardHand.getInBetweenCards(x, y);
            const inBetweenIndex = (() => {
              if (inBetweenCards.length === 1) {
                if (inBetweenCards[0] === 0) return 0;
                return inBetweenCards[0] + 1;
              }
              return inBetweenCards[1];
            })();
            const distanceToCard = distances.find((x2) => x2.i === inBetweenIndex);
            const maxDist = ThrownCardsDimensions.maxPickupRatio;
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
        }
        if (index !== null) {
          GameContext.gameService.takeThrownCard();
          thrownCards.removeCard();
          HoldContext.swapHolding(cardHand.addCard(this.card, index));
        }
      } finally {
        HoldContext.stopHolding(e);
      }
    }
  };

  // public/scripts/entities/thrownCards.js
  var ThrownCards = class extends Entity {
    constructor() {
      super();
      this.cards = [];
    }
    get x() {
      return ThrownCardsDimensions.x;
    }
    get y() {
      return ThrownCardsDimensions.y;
    }
    get scale() {
      return ThrownCardsDimensions.scale;
    }
    drawPath() {
      DrawContext.beginPath();
      DrawContext.rect(-ThrownCardsDimensions.size / 2, -ThrownCardsDimensions.size / 2, ThrownCardsDimensions.size, ThrownCardsDimensions.size);
    }
    draw() {
      withContext(() => {
        this.contextPrepare();
        this.drawPath();
        DrawContext.fillStyle = "#bbbbbb";
        DrawContext.strokeStyle = "#222222";
        DrawContext.fill();
        DrawContext.stroke();
        forEachContext(this.cards, (card) => {
          if (HoldContext.isHolding(card)) {
            HoldContext.scale = this.scale;
            return;
          }
          card.preparePosition();
          const letGoTimePassed = HoldContext.letGoTimePassed(card);
          if (!CardAnimations.animationFinished(letGoTimePassed)) {
            const throwTransform = DrawContext.getTransform();
            let rot = normalizeRadians(card.totalRotation());
            const animation = animationLerpTransform({
              startX: HoldContext.lastHoldX,
              startY: HoldContext.lastHoldY,
              endX: throwTransform.e,
              endY: throwTransform.f,
              startRot: 0,
              endRot: rot,
              amt: CardAnimations.getMovementAmt(letGoTimePassed)
            });
            contextSetTransform(animation);
            DrawContext.scale(this.scale, this.scale);
          }
          card.draw();
        });
      });
    }
    isPointIn(x, y) {
      return withContext(() => {
        this.contextPrepare();
        this.drawPath();
        return DrawContext.isPointInPath(x, y);
      });
    }
    addCard(card) {
      const thrownCard = new ThrownCard(card, 0);
      this.cards.push(thrownCard);
      return thrownCard;
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
  };

  // public/scripts/entities/cardDeck.js
  var CardDeck = class extends Entity {
    constructor() {
      super();
    }
    get x() {
      return CardDeckDimensions.x;
    }
    get y() {
      return CardDeckDimensions.y;
    }
    get scale() {
      return CardDeckDimensions.scale * CardDimensions.scale;
    }
    draw() {
      withContext(() => {
        this.contextPrepare();
        Card.drawBack();
      });
    }
    isPointIn(x, y) {
      const {
        width,
        height,
        radius
      } = CardDimensions;
      return withContext(() => {
        this.contextPrepare();
        DrawContext.translate(-CardDimensions.width / 2, -CardDimensions.height / 2);
        DrawContext.beginPath();
        DrawContext.roundRect(0, 0, width, height, radius);
        return DrawContext.isPointInPath(x, y);
      });
    }
    handleMouseDown(e) {
      const result = GameContext.gameService.takeDeckCard();
      const card = new Card(result);
      card.isNew = true;
      HoldContext.startHolding(e, card);
    }
  };

  // public/scripts/entities/phaseCardAction.js
  var PhaseCardAction = class extends Action {
  };
  var PhaseCardAdd = class extends PhaseCardAction {
    constructor(groupIndex, side, x, y) {
      super();
      this.type = "add";
      this.groupIndex = groupIndex;
      PhaseCardAddSide.validate(side);
      this.side = side;
      this.x = x;
      this.y = y;
    }
  };
  var PhaseCardsPlacePhase = class extends PhaseCardAction {
    constructor(selectedPositions) {
      super();
      this.type = "placePhase";
      this.selectedPositions = selectedPositions;
    }
  };

  // public/scripts/entities/phaseCards.js
  var PhaseCards = class _PhaseCards extends Entity {
    constructor() {
      super();
      this.phasePlacedTime = Number.NEGATIVE_INFINITY;
      this.phaseGroups = [];
      this.action = null;
    }
    get x() {
      return PhaseCardsDimensions.x;
    }
    get y() {
      return PhaseCardsDimensions.y;
    }
    draw() {
      withContext(() => {
        this.contextPrepare();
        drawDebug(() => {
          const {
            width
          } = PhaseCardsDimensions;
          const {
            height,
            scale: scale2
          } = CardDimensions;
          DrawContext.beginPath();
          DrawContext.arc(0, 0, 10, 0, 2 * Math.PI);
          DrawContext.fill();
          DrawContext.beginPath();
          DrawContext.strokeRect(-width / 2, -height * scale2 / 2, width, height * scale2);
          const { groupGap } = this.computeGapWidths();
          const groupBounds = this.getHoverPositions();
          groupBounds.forEach((bound) => {
            const { start, end } = bound;
            DrawContext.beginPath();
            DrawContext.strokeRect(start, -height * scale2 / 2, end - start, height * scale2);
            withContext(() => {
              DrawContext.strokeStyle = "cyan";
              DrawContext.lineWidth = 5;
              DrawContext.translate(start, 0);
              DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
              Card.drawDebug(0, 0, { withCenter: false });
            });
            withContext(() => {
              DrawContext.strokeStyle = "cyan";
              DrawContext.lineWidth = 5;
              DrawContext.translate(end, 0);
              DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
              Card.drawDebug(0, 0, { withCenter: false });
            });
          });
        });
        if (this.phaseGroups.length === 0) return;
        const cardPositions = this.getCardPositions();
        const action = this.action;
        const scale = this.scale;
        if (action && !CardAnimations.animationFinished(action.timePassed)) {
          const amt = CardAnimations.getMovementAmt(action.timePassed);
          const { e: thisX, f: thisY } = DrawContext.getTransform();
          switch (action.type) {
            case "placePhase":
              this.phaseGroups.forEach((group, i) => {
                forEachContext(group.cardInfos, (cardInfo, j) => {
                  const { x, y, rotation } = action.selectedPositions[i][j];
                  const lerpX = lerp(x, thisX + cardPositions[i][j], amt);
                  const lerpY = lerp(y, thisY, amt);
                  const lerpRotation = lerp(rotation, 0, amt);
                  DrawContext.setTransform(scale, 0, 0, scale, lerpX, lerpY);
                  DrawContext.rotate(lerpRotation);
                  Card.drawStatic(cardInfo);
                });
              });
              break;
            case "add":
              const { groupIndex, side, x: actionX, y: actionY } = action;
              const groupLengths = this.getGroupLengths();
              const prevGroupLengths = [...groupLengths];
              prevGroupLengths[groupIndex]--;
              const groupPositions = _PhaseCards.getCardPositionsCore(groupLengths);
              const prevGroupPositions = _PhaseCards.getCardPositionsCore(prevGroupLengths);
              let addedCardX = null;
              switch (side) {
                case PhaseCardAddSide.START:
                  addedCardX = groupPositions[groupIndex].shift();
                  break;
                case PhaseCardAddSide.END:
                  addedCardX = groupPositions[groupIndex].pop();
                  break;
              }
              groupPositions.forEach((group, i) => {
                const prevGroup = prevGroupPositions[i];
                const shiftIndex = side === PhaseCardAddSide.START ? 1 : 0;
                const drawActionCard = (cardInfo) => {
                  const lerpX = lerp(actionX, thisX + addedCardX, amt);
                  const lerpY = lerp(actionY, thisY, amt);
                  DrawContext.setTransform(scale, 0, 0, scale, lerpX, lerpY);
                  Card.drawStatic(cardInfo);
                };
                if (side === PhaseCardAddSide.START && i === groupIndex) {
                  drawActionCard(this.phaseGroups[groupIndex].cardInfos[0]);
                }
                forEachContext(group, (x, j) => {
                  const lerpX = lerp(prevGroup[j], x, amt);
                  DrawContext.setTransform(scale, 0, 0, scale, thisX + lerpX, thisY);
                  Card.drawStatic(this.phaseGroups[i].cardInfos[j + shiftIndex]);
                });
                if (side === PhaseCardAddSide.END && i === groupIndex) {
                  drawActionCard(this.phaseGroups[groupIndex].cardInfos[groupLengths[groupIndex] - 1]);
                }
              });
              break;
          }
        } else {
          this.phaseGroups.forEach((group, i) => {
            forEachContext(group.cardInfos, (cardInfo, j) => {
              DrawContext.translate(cardPositions[i][j], 0);
              Card.drawStatic(cardInfo);
            });
          });
          const holdEntity = HoldContext.holdEntity;
          let holdCardInfo = null;
          if (holdEntity instanceof Card && !holdEntity.isNew) {
            holdCardInfo = holdEntity.info;
          }
          if (holdEntity instanceof ThrownCard) {
            holdCardInfo = holdEntity.card.info;
          }
          if (holdCardInfo) {
            const hoverPositions = this.getHoverPositions();
            const allowedPositions = this.getAllowedAdds(holdCardInfo);
            hoverPositions.forEach((positions, i) => {
              const allowedPosition = allowedPositions[i];
              const { start, end } = positions;
              if (allowedPosition.start) {
                withContext(() => {
                  DrawContext.translate(start, 0);
                  DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                  Card.drawOutline(HoverColors.fill, HoverColors.stroke, HoverColors.lineWidth);
                });
              }
              if (allowedPosition.end) {
                withContext(() => {
                  DrawContext.translate(end, 0);
                  DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
                  Card.drawOutline(HoverColors.fill, HoverColors.stroke, HoverColors.lineWidth);
                });
              }
            });
          }
        }
      });
    }
    static computeGapWidthsCore(groupLengths) {
      const {
        width,
        minCardGap,
        groupGapWeight,
        minGroupGap
      } = PhaseCardsDimensions;
      const totalCards = groupLengths.reduce((acc, group) => acc + group, 0);
      const cardGaps = totalCards - groupLengths.length;
      const groupGaps = groupLengths.length - 1;
      const totalGaps = cardGaps + groupGaps * groupGapWeight;
      let gapWidth = width / totalGaps;
      let groupGap = gapWidth * groupGapWeight;
      if (groupGap < minGroupGap) {
        const adjustment = minGroupGap - groupGap;
        groupGap = minGroupGap;
        gapWidth -= adjustment / cardGaps;
      }
      const totalWidth = cardGaps * gapWidth + groupGaps * groupGap;
      return { groupGap, gapWidth, totalWidth };
    }
    computeGapWidths() {
      return _PhaseCards.computeGapWidthsCore(this.getGroupLengths());
    }
    static getCardPositionsCore(groupLengths) {
      const { groupGap, gapWidth, totalWidth } = _PhaseCards.computeGapWidthsCore(groupLengths);
      let consumedWidth = -Math.min(PhaseCardsDimensions.width, totalWidth) / 2;
      return groupLengths.map((len, i) => {
        const positions = Array.from({ length: len }).map(() => {
          const x = consumedWidth;
          consumedWidth += gapWidth;
          return x;
        });
        consumedWidth += groupGap - gapWidth;
        return positions;
      });
    }
    getCardPositions() {
      return _PhaseCards.getCardPositionsCore(this.getGroupLengths());
    }
    getGroupLengths() {
      return this.phaseGroups.map((group) => group.cardInfos.length);
    }
    getHoverPositions() {
      const { groupGap, gapWidth, totalWidth } = this.computeGapWidths();
      const cardHalfWidth = CardDimensions.width * CardDimensions.scale / 2;
      let firstCard = -Math.min(PhaseCardsDimensions.width, totalWidth) / 2;
      return this.phaseGroups.map((group, i) => {
        const lastCard = firstCard + gapWidth * (group.cardInfos.length - 1);
        const bound = { start: firstCard - cardHalfWidth, end: lastCard + cardHalfWidth };
        firstCard = lastCard + groupGap;
        return bound;
      });
    }
    placePhase(action, phaseGroups) {
      this.action = action;
      this.phaseGroups = phaseGroups;
    }
    getEntityAt(x, y) {
      return null;
    }
    isPointIn(x, y) {
      return withContext(() => {
        this.contextPrepare();
        return this.getHoverPositions().some(
          ({ start, end }) => [start, end].some(
            (pos) => withContext(() => {
              DrawContext.translate(pos, 0);
              DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
              console.log(DrawContext.getTransform());
              console.log(x, y);
              Card.drawPath();
              return DrawContext.isPointInPath(x, y);
            })
          )
        );
      });
    }
    addPhaseCard(cardInfo, x, y) {
      return withContext(() => {
        this.contextPrepare();
        const hoverPositions = this.getHoverPositions();
        let groupIndex = null, side = null;
        hoverPositions.some(
          ({ start, end }, i) => [{ x: start, side: PhaseCardAddSide.START }, { x: end, side: PhaseCardAddSide.END }].some(
            (pos) => withContext(() => {
              DrawContext.translate(pos.x, 0);
              DrawContext.scale(CardDimensions.scale, CardDimensions.scale);
              console.log(DrawContext.getTransform());
              console.log(x, y);
              Card.drawPath();
              if (DrawContext.isPointInPath(x, y)) {
                if (hoverPositions[i][pos.side]) {
                  groupIndex = i;
                  side = pos.side;
                }
                return true;
              }
            })
          )
        );
        if (groupIndex === null || side === null) {
          return false;
        }
        this.phaseGroups = GameContext.gameService.addPhaseCard(cardInfo, groupIndex, side);
        this.action = new PhaseCardAdd(groupIndex, side, x, y);
        return true;
      });
    }
    getAllowedAdds(cardInfo) {
      return GameContext.gameService.phaseService.addCardAllowedPositions(this.phaseGroups, cardInfo);
    }
  };

  // public/scripts/infrastructure/gameContext.js
  var GameContext = {
    mouse: {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0
    },
    holdEntity: null,
    gameService: null,
    step: null,
    getEntityAt(x, y) {
      let entity = null;
      this.forEachEntity((e) => {
        const entityAt = e.getEntityAt(x, y);
        if (entityAt) {
          entity = entityAt;
        }
      });
      return entity;
    },
    setupGame() {
      const seed = "peach";
      this.gameService = new GameService();
      this.gameService.initialiseGame(seed);
      const cards = this.gameService.takeHand().map((x) => new Card(x));
      const cardHand = new CardHand(cards);
      const thrownCards = new ThrownCards();
      thrownCards.cards.push(new ThrownCard(new Card(this.gameService.thrownCards[0])));
      const cardDeck = new CardDeck();
      const phaseCards = new PhaseCards();
      this.entities = {
        cardHand,
        thrownCards,
        cardDeck,
        phaseCards
      };
    },
    forEachEntity(func) {
      for (const [key, entity] of Object.entries(this.entities)) {
        func(entity);
      }
    }
  };

  // public/scripts/infrastructure/actionController.js
  var ActionController = class {
    static placePhase() {
      const {
        cardHand,
        phaseCards
      } = GameContext.entities;
      const cardPositions = cardHand.getCardEntitiesPositions();
      const selectedCards = cardPositions.filter((x) => x.card.selectContext.isSelected);
      const phaseGroups = GameContext.gameService.placePhase(selectedCards.map((x) => x.card.info));
      cardHand.placePhase();
      const selectedPositions = phaseGroups.map(
        (phaseGroup) => phaseGroup.cardInfos.map((info) => {
          const cardPositionIndex = selectedCards.findIndex((x) => x.card.info === info);
          const cardPosition = selectedCards.splice(cardPositionIndex, 1)[0];
          return {
            x: cardPosition.x,
            y: cardPosition.y,
            z: cardPosition.z,
            rotation: cardPosition.rotation
          };
        })
      );
      phaseCards.placePhase(new PhaseCardsPlacePhase(selectedPositions), phaseGroups);
      DomController.checkSelectPhaseButton(false);
    }
    static toggleSelectPhase() {
      const checked = GameContext.gameService.toggleSelectPhase();
      DomController.checkSelectPhaseButton(checked);
      if (!checked) {
        SelectContext.clearSelections();
      }
    }
  };

  // public/scripts/infrastructure/listeners.js
  function setupMouseListeners() {
    GameCanvas.addEventListener("mousedown", handleMouseDown);
    GameCanvas.addEventListener("mouseup", handleMouseUp);
    GameCanvas.addEventListener("click", handleClick);
    GameCanvas.addEventListener("mousemove", handleMouseMove);
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
    } catch (e) {
      if (e instanceof ActionError) {
        ErrorContext.setActionError(e);
      } else {
        throw e;
      }
    } finally {
      GameContext.step = null;
    }
  }

  // public/scripts/infrastructure/settings.js
  var settings = {
    x: 600,
    y: 600,
    scale: 1,
    cards: 10
  };
  (function renderSettings() {
    const settingsDiv = document.getElementById("settings");
    if (!settingsDiv) return;
    for (const [key, value] of Object.entries(settings)) {
      const settingNode = document.createElement("div");
      const settingName = document.createElement("span");
      settingName.textContent = key;
      const input = document.createElement("input");
      const inputId = `setting_${key}`;
      input.value = value;
      input.id = inputId;
      if (typeof value === "number") {
        input.setAttribute("type", "number");
        input.addEventListener("change", (e) => {
          settings[key] = Number(input.value);
        });
      } else if (typeof value === "string") {
        input.setAttribute("type", "string");
        input.addEventListener("change", (e) => {
          settings[key] = input.value;
        });
      }
      settingNode.appendChild(settingName);
      settingNode.appendChild(input);
      settingsDiv.appendChild(settingNode);
    }
  })();

  // public/scripts/infrastructure/gameLoop.js
  function update() {
    const {
      cardHand
    } = GameContext;
  }
  function draw() {
    const {
      entities
    } = GameContext;
    GameContext.step = GameStep.DRAW;
    DrawContext.fillStyle = "#eeeeee";
    DrawContext.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
    DrawContext.fillStyle = "#bbbbbb";
    DrawContext.fillRect(0, 0, 100, 100);
    GameContext.forEachEntity((x) => x.draw());
    DrawContext.drawZ.filter((x) => x.z <= 100).sort((a, b) => a.z - b.z).forEach((x) => x.func());
    HoldContext.draw();
    DrawContext.drawZ.filter((x) => x.z > 100).sort((a, b) => a.z - b.z).forEach((x) => x.func());
    DrawContext.drawZ = [];
    GameContext.step = GameStep.DRAW;
  }
  function gameLoop(currentTime) {
    updateTime(currentTime);
    try {
      update();
      withContext(draw);
    } catch (error) {
      console.error(error);
    } finally {
      restoreAllContext();
      const error = ErrorContext.getCurrentError();
      if (error) {
        DrawContext.font = "20px Georgia";
        DrawContext.fillStyle = "black";
        DrawContext.fillText(error, 100, 100);
      }
      nextFrame();
    }
  }
  function nextFrame() {
    requestAnimationFrame(gameLoop);
  }

  // public/scripts/index.js
  (function main() {
    GameContext.setupGame();
    setupMouseListeners();
    nextFrame();
  })();
})();
