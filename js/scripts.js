let jsStarted = Date.now();

const imagePaths = [
  'media/images/kirby.png',
  'media/images/waddledee.png',
  'media/images/numbers.png',
  'media/images/1000.png',
  'media/images/3000.png',
  'media/images/5000.png',
];
await preloadImages();
console.log('loaded', imagePaths.length, 'images in', (Date.now() - jsStarted));

const options = {
  introPanSpeed: 1200,
  suspenseTime: { min: 1000, max: 2000 },
  bonusAmounts: [0, 1000, 3000, 5000],
}

const game = {
  scaleAmount: 1.5,
  spriteBuffer: 2,
};

const player = {
  score: 0,
  level: 0,
}

const spriteSheetData = {
  kirby: {
    baseSize: { width: 16, height: 16 },
    frames: [
      'waiting',
      'drawing',
      'blinking',
      'dead1',
      'dead2',
      'dead3',
      'dead4',
    ],
    attachments: {
      hat: {
        frames: ['hat', 'hat2']
      },
      gun: {
        frames: ['gun', 'spinninggun'],
      }
    }
  },
  waddledee: {
    baseSize: { width: 16, height: 16 },
    frames: [
      'waiting',
      'drawing',
      'dead',
    ],
    attachments: {
      hat: {
        frames: ['hat']
      },
      gun: {
        frames: ['gun']
      }
    }
  }
}

const attackers = [
  {
    name: 'waddledee',
    drawSpeed: 800,
    scale: 1,
    suspenseTime: { min: 1500, max: 2500 },
  },
  {
    name: 'chicken',
    drawSpeed: 400,
    width: 24,
    height: 28,
    suspenseTime: { min: 750, max: 4000 },
  }
];
const roundStatus = {
  drawStarted: false,
  attackerFired: false,
  fouled: false,
  won: false,
  startedAt: 0,
  bonusRank: 0,
}

let pixelSize;
let scaledPixelSize;

window.addEventListener('load', () => {
  setDimensions();
  document.getElementById('start-button').addEventListener('pointerdown', handleStartClick);
  document.getElementById('a-button').addEventListener('pointerdown', handleAClick);
  displayNumber(player.score, '#score-display');
  document.body.style.opacity = 1;
});

function setDimensions() {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  document.documentElement.style.setProperty('--intro-pan-speed', options.introPanSpeed + 'ms');
  let pixelWidth = 170;
  let pixelHeight = 150;
  pixelSize = (window.innerWidth / pixelWidth);
  scaledPixelSize = pixelSize * game.scaleAmount;
  // let gameScreenHeight = Math.round(pixelSize * pixelHeight);
  let gameScreenHeight = pixelSize * pixelHeight;
  console.warn('pixelSize:', pixelSize);
  console.warn('scaledPixelSize:', scaledPixelSize);
  console.warn('gameScreenHeight:', gameScreenHeight);
  // let spriteHeight = Math.round(pixelSize * 24);
  let spriteHeight = scaledPixelSize * 16;
  console.warn('spriteHeight:', spriteHeight);
  
  // document.documentElement.style.setProperty('--nes-pixel-size', pixelSize + 'px');
  document.documentElement.style.setProperty('--nes-pixel-size', pixelSize + 'px');
  document.documentElement.style.setProperty('--scaled-pixel-size', scaledPixelSize + 'px');
  document.documentElement.style.setProperty('--game-screen-height', gameScreenHeight + 'px');
  document.documentElement.style.setProperty('--sprite-height', spriteHeight + 'px');
}

async function handleStartClick() {
  document.body.classList.add('hide-intro');
  initiateRound(player.level);
}

async function initiateRound(level) {
  console.log('init round', level)
  displayLevel(level);
  await pause(2000);
  document.getElementById("battle-area").classList.remove('dimmed');
  loadAttacker(attackers[level]);
  document.body.classList.add('playing');
  await pause(options.introPanSpeed);
  revealFighters();
  let suspenseTime = randomInt(attackers[level].suspenseTime.min, attackers[level].suspenseTime.max);
  await pause(suspenseTime);
  if (!roundStatus.fouled) {
    callToFire();
  }
}

function revealFighters(hide) {
  let action = hide ? 'remove' : 'add';
  document.getElementById('kirby').classList[action]('visible');
  document.getElementById('attacker').classList[action]('visible');
}

async function endRound() {
  revealFighters(true);
  document.body.classList.remove('playing');
  await pause(300);
  document.getElementById('battle-area').classList.add('dimmed');
  await pause(1000);
  changeFrame('kirby', 'waiting');
  changeFrame('waddledee', 'waiting');
  document.getElementById('kirby').classList = ['sprite'];
  document.getElementById('attacker').classList = ['sprite'];
  document.querySelector('#kirby > .gun').classList = ['gun'];
  document.querySelector('#attacker > .gun').classList = ['gun'];
  changeGameMessage();
  roundStatus.drawStarted = false;
  roundStatus.attackerFired = false;
  roundStatus.fouled = false;
  roundStatus.won = false;
  roundStatus.startedAt = 0;
  roundStatus.bonusRank = 0;
}

async function handleAClick(e) {
  if (!roundStatus.fouled && !roundStatus.won && !roundStatus.attackerFired) {
    if (!roundStatus.drawStarted) {
      changeGameMessage('foul');
      changeFrame('kirby', 'blinking');
      roundStatus.fouled = true;
      await pause(1000);
      await endRound();
      initiateRound(0);
    } else if (!roundStatus.attackerFired) {
      defeatAttacker();
    }
  }
}

async function defeatAttacker() {
  document.getElementById('kirby').classList.add('drawing');
  changeFrame('kirby', 'drawing');
  document.getElementById('attacker').classList.add('defeated');
  document.getElementById('attacker-hat').classList.add('defeated');
  changeFrame(attackers[player.level].name, 'dead')
  roundStatus.won = true;
  let reactionTime = Date.now() - roundStatus.startedAt;
  document.getElementById('time-display').innerText = reactionTime + 'ms';
  let bonus = calculateBonus(reactionTime);
  roundStatus.bonusRank = bonus.rank;
  player.score += bonus.points;
  displayNumber(player.score, '#score-display');
  await pause(1000);
  if (bonus.rank) {
    changeBonusMessage('bonus');
  } else {
    changeBonusMessage('nobonus');
  }
  await pause(600);
  await spinGun(randomInt(500, 2000));
  await pause(1200);
  changeBonusMessage();

  await endRound();
  initiateRound(0);
}

function changeBG(query, imagePath) {
  document.querySelector(query).style.backgroundImage = `url(${imagePath})`;
}

function calculateBonus(reactionTime) {
  let rank = 0;
  let attacker = attackers[player.level];
  let bonusLimits = [
    (attacker.drawSpeed * 0.3),
    (attacker.drawSpeed * 0.45),
    (attacker.drawSpeed * 0.6),
  ];
  console.table(bonusLimits);
  if (reactionTime <= bonusLimits[0]) {
    rank = 3;
  } else if (reactionTime <= bonusLimits[1]) {
    rank = 2;
  } else if (reactionTime <= bonusLimits[2]) {
    rank = 1;
  }
  let points = options.bonusAmounts[rank];
  let timeToSpare = (attacker.drawSpeed - reactionTime);
  let spareBonus = timeToSpare * (rank / 3);
  points += spareBonus;
  return { points: Math.round(points), rank };
}

function changeFrame(playerID, newFrame) {
  let elementID = playerID === 'kirby' ? 'kirby' : 'attacker';
  let element = document.getElementById(elementID);
  let baseSize = spriteSheetData[playerID].baseSize;
  let frameIndex = spriteSheetData[playerID].frames.indexOf(newFrame);
  let scaledBuffer = game.spriteBuffer * frameIndex;
  let newBGPosition = ((baseSize.width * frameIndex * -1) - scaledBuffer);
  newBGPosition *= pixelSize;;
  newBGPosition *= game.scaleAmount;
  element.style.backgroundPosition = `${newBGPosition}px 0`;
}

function changeGameMessage(newMessage) {
  if (newMessage) {
    document.getElementById('game-message').style.opacity = '1';
    document.getElementById('game-message').style.backgroundImage = `url("media/images/${newMessage}.png")`;
  } else {
    document.getElementById('game-message').style.opacity = '0';
  }
}

function changeBonusMessage(newMessage) {
  if (newMessage) {
    document.getElementById('bonus-message').style.opacity = '1';
    document.getElementById('bonus-message').style.backgroundImage = `url("media/images/${newMessage}.png")`;
    if (roundStatus.bonusRank) {
      document.getElementById('bonus-message').classList.add(`rank-${roundStatus.bonusRank}`);
    }
  } else {
    document.getElementById('bonus-message').style.opacity = '0';
  }
}

function displayLevel(newLevel) {
  newLevel++;
  document.querySelector('#level-message > .level-digit').style.backgroundPositionX = (newLevel - 1) * -8 * game.scaleAmount * pixelSize + 'px';
  document.getElementById('level-message').style.opacity = '1';
  setTimeout(() => {
    document.getElementById('level-message').style.opacity = '0';
  }, 1200);
}

function displayNumber(num, targetQuery) {
  let numString = num.toString();
  let displayElement = document.querySelector(targetQuery);
  displayElement.innerHTML = '';

  for (let digit in numString) {
    let currentDigit = parseInt(numString[digit]);
    let digitElement = document.createElement('div');
    digitElement.classList.add('score-number');
    digitElement.style.backgroundImage = 'url("media/images/numbers.png")';
    digitElement.style.backgroundPositionX = (pixelSize * -8) * currentDigit + 'px';
    displayElement.append(digitElement);
  }
}

function loadAttacker(attacker) {
  console.log('loading', attacker.name);
  let attackerElement = document.getElementById('attacker');
  attackerElement.style.backgroundImage = `url("media/images/${attacker.name}.png")`;
  let actualSize = {
    width: spriteSheetData[attacker.name].baseSize.width * pixelSize * game.scaleAmount,
    height: spriteSheetData[attacker.name].baseSize.width * pixelSize * game.scaleAmount,
  };
  console.log('width to', actualSize.width + 'px')
  console.log('height to', actualSize.height + 'px')
  attackerElement.style.width = actualSize.width + 'px';
  attackerElement.style.height = actualSize.height + 'px';
}

async function callToFire() {
  let attackDelay = attackers[player.level].drawSpeed;
  roundStatus.startedAt = Date.now();
  changeGameMessage('fire');
  document.getElementById('a-button').classList.remove('dimmed');
  setTimeout(() => {
    changeGameMessage();
    document.getElementById('a-button').classList.add('dimmed');
  }, attackDelay);
  changeFrame(attackers[player.level].name, 'drawing')
  roundStatus.drawStarted = true;
  document.getElementById('attacker').classList.add('telegraphing');
  await pause(attackDelay);
  if (!roundStatus.won && !roundStatus.fouled) {
    roundStatus.attackerFired = true;
    document.getElementById('attacker').classList.remove('telegraphing');
    document.getElementById('attacker').classList.add('drawing');
    // document.querySelector('#attacker > .gun').classList.add('drawn');
    document.getElementById('kirby').classList.add('defeated');
    document.querySelector('#kirby + .hat').classList.add('defeated');
    await animateFrameSequence('kirby', 'dead', [
      { frame: 1, duration: 225 },
      { frame: 2, duration: 225 },
      { frame: 3, duration: 150 },
      { frame: 4, duration: 225 },
      { frame: 3, duration: 150 },
    ]);
    await pause(750);
    await endRound();
    initiateRound(0);
  }
}

async function animateFrameSequence(elementID, prefix, sequence) {
  console.log('type:', typeof sequence)
  if (typeof sequence == 'number') {
    for (let i = 1; i <= sequence; i++) {
      changeFrame('kirby', `${prefix}${i}`);
      console.log('changing to', `${prefix}${i}`)
      await pause(200);
    }
  } else {
    for (let step in sequence) {
      let frameIndex = sequence[step].frame;
      let frameDuration = sequence[step].duration;
      changeFrame(elementID, `${prefix}${frameIndex}`);
      await pause(frameDuration);
    };
  }
}

async function spinGun(duration) {
  document.getElementById('kirby').classList.add('spinning');
  // document.querySelector('#kirby > .gun').classList.add('spinning');
  document.querySelector('#kirby > .gun').style.animationDuration = duration + 'ms';
  await pause(duration);
  document.getElementById('kirby').classList.remove('spinning');
  document.getElementById('kirby').classList.remove('drawing');
  // document.querySelector('#kirby > .gun').classList.remove('spinning');
  // document.querySelector('#kirby > .gun').classList.remove('drawn');
  changeFrame('kirby', 'waiting');
  // changeBG('#kirby + .hat', 'media/images/kirbyhat.png');
  document.getElementById('kirby').classList.add('holstering');
  setTimeout(() => {
    document.getElementById('kirby').classList.remove('holstering');
  }, 200);
}

async function advanceRound() {
  player.level++;
  if (player.level >= attackers.length) {
    player.level = 0;
  }
  loadAttacker(attackers[player.level]);
  await callToFire();
}

function preload(arr) {
  let images = [];
  for (let p = 0; p < arr.length; p++) {
    let path = arr[p];
    images[p] = new Image();
    images[p].src = path;
    images[p].style.display = 'none';
    document.body.appendChild(images[p]);
  };
}
function preloadImages() {
  return new Promise((resolve) => {
    preload(imagePaths);
    resolve();
  });
}

const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);