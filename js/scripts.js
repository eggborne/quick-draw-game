let jsStarted = Date.now();
preloadImages();
const options = {
  introPanSpeed: 1200,
  suspenseTime: { min: 1000, max: 2000 },
  bonusAmounts: [ 0, 1000, 3000, 5000 ],
}

const game = {
  scaleAmount: 1.5,
};

const player = {
  score: 0,

}

const spriteSheetData = {
  kirby: {
    baseSize: { width: 16, height: 16 },
    frames: [
      'waiting',
      'drawing',
      'disappointed',
      'dead1',
      'dead2',
      'dead3',
      'dead4',
    ],
  },
  waddledee: {
    baseSize: { width: 16, height: 16 },
    frames: [
      'waiting',
      'drawing',
      'dead'
    ],
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

const levelReached = 0;
let pixelSize;

window.addEventListener('load', () => {
  setDimensions();
  document.getElementById('start-button').addEventListener('pointerdown', handleStartClick);
  document.getElementById('a-button').addEventListener('pointerdown', handleAClick);
  displayNumber(player.score, '#score-display');
});

function setDimensions() {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  document.documentElement.style.setProperty('--intro-pan-speed', options.introPanSpeed + 'ms');
  let pixelWidth = 170;
  let pixelHeight = 150;
  pixelSize = window.innerWidth / pixelWidth;
  let gameScreenHeight = Math.round(pixelSize * pixelHeight);
  console.warn('pixelSize:', pixelSize);
  console.warn('gameScreenHeight = ' + gameScreenHeight);
  // let spriteHeight = Math.round(pixelSize * 24);
  let spriteHeight = pixelSize * 24;
  document.documentElement.style.setProperty('--nes-pixel-size', pixelSize + 'px');
  document.documentElement.style.setProperty('--game-screen-height', gameScreenHeight + 'px');
  document.documentElement.style.setProperty('--sprite-height', spriteHeight + 'px');
}

async function handleStartClick() {
  document.body.classList.add('hide-intro');
  initiateRound(levelReached);
}

async function initiateRound(level) {
  displayLevel(level+1);
  await pause(1200);
  document.getElementById("battle-area").classList.remove('dimmed');
  await pause(200);
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
}

function handleAClick(e) {
  if (!roundStatus.fouled && !roundStatus.won && !roundStatus.attackerFired) {
    if (!roundStatus.drawStarted) {
      changeGameMessage('foul');
      changeFrame('kirby', 'disappointed');
      roundStatus.fouled = true;
    } else if (!roundStatus.attackerFired) {
      defeatAttacker();
    }
  }
}

function playRoundIntro() {

}

async function defeatAttacker() {
  changeFrame('kirby', 'drawing');
  changeBG('#kirby + .hat', 'media/images/kirbyhat2.png');
  document.querySelector('#kirby > .gun').classList.add('drawn');
  document.getElementById('attacker').classList.add('defeated');
  document.getElementById('attacker-hat').classList.add('defeated');
  changeFrame(attackers[levelReached].name, 'dead')
  roundStatus.won = true;
  let reactionTime = Date.now() - roundStatus.startedAt;
  document.getElementById('time-display').innerText = reactionTime + 'ms';
  let bonus = calculateBonus(reactionTime);
  roundStatus.bonusRank = bonus.rank;
  player.score += bonus.points;
  displayNumber(bonus.points, '#score-display');
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
}

function changeBG(query, imagePath) {
  document.querySelector(query).style.backgroundImage = `url(${imagePath})`;
}

function calculateBonus(reactionTime) {
  let rank = 0;
  let attacker = attackers[levelReached];
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
  let spareBonus = timeToSpare * (rank/3);
  points += spareBonus;
  return { points: Math.round(points), rank };
}

function changeFrame(playerID, newFrame) {
  let elementID = playerID !== 'kirby' ? 'attacker' : 'kirby';
  let element = document.getElementById(elementID);
  let baseSize = spriteSheetData[playerID].baseSize;
  let frameIndex = spriteSheetData[playerID].frames.indexOf(newFrame);
  let newBGPosition = pixelSize * baseSize.width * game.scaleAmount * frameIndex * -1;
  console.log('newBGPosition for', playerID, newBGPosition)
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
  if (newLevel) {
    document.querySelector('#level-message > .level-digit').style.backgroundPositionX = (newLevel-1) * -8 * game.scaleAmount * pixelSize + 'px';
    document.getElementById('level-message').style.opacity = '1';
    setTimeout(() => {
      document.getElementById('level-message').style.opacity = '0';
    }, 1200);
  } else {
    document.getElementById('level-message').style.opacity = '0';
  }
}

function displayNumber(num, targetQuery) {
  let numString = num.toString();
  let displayElement = document.querySelector(targetQuery);
  displayElement.innerHTML = '';

  for (let digit in numString) {
    let currentDigit = parseInt(numString[digit]);
    let digitElement = document.createElement('div');
    // let newBGPosition = 
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
  document.getElementById('attacker-hat').style.width = actualSize.width + 'px';
  document.getElementById('attacker-hat').style.height = actualSize.height/2 + 'px'; // hat.png should be 16x16
}

async function callToFire() {
  let attackDelay = attackers[levelReached].drawSpeed;
  roundStatus.startedAt = Date.now();
  changeGameMessage('fire');
  document.getElementById('a-button').classList.remove('dimmed');
  setTimeout(() => {
    changeGameMessage();
    document.getElementById('a-button').classList.add('dimmed');
  }, attackDelay);
  changeFrame(attackers[levelReached].name, 'drawing')
  roundStatus.drawStarted = true;
  await pause(attackDelay);
  if (!roundStatus.won && !roundStatus.fouled) {
    roundStatus.attackerFired = true;
    document.querySelector('#attacker > .gun').classList.add('drawn');
    document.getElementById('kirby').classList.add('defeated');
    document.querySelector('#kirby + .hat').classList.add('defeated');
    await animateFrameSequence('kirby', 'dead', [
      {frame: 1, duration: 225},
      {frame: 2, duration: 225},
      {frame: 3, duration: 150},
      {frame: 4, duration: 225},
      {frame: 3, duration: 150},
    ]);
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
    // for (let i = 0; i < sequence.length-1; i++) {
    //   let frameIndex = sequence[i];
    //   changeFrame('kirby', `${prefix}${frameIndex}`);
    //   console.log('changing to', `${prefix}${frameIndex}`)
    //   await pause(200);
    // };
    for (let step in sequence) {
      let frameIndex = sequence[step].frame;
      let frameDuration = sequence[step].duration;
      changeFrame(elementID, `${prefix}${frameIndex}`);
      console.log('changing to', `${prefix}${frameIndex}`)
      await pause(frameDuration);
    };
  }
}

async function spinGun(duration) {
  document.querySelector('#kirby > .gun').classList.add('spinning');
  changeBG('#kirby > .gun', 'media/images/spinninggun.png');
  document.querySelector('#kirby > .gun').style.animationDuration = duration + 'ms';
  await pause(duration);
  document.querySelector('#kirby > .gun').classList.remove('spinning');
  document.querySelector('#kirby > .gun').classList.remove('drawn');
  changeFrame('kirby', 'waiting');
  changeBG('#kirby + .hat', 'media/images/kirbyhat.png');
  document.getElementById('kirby').classList.add('holstering');
  setTimeout(() => {
    document.getElementById('kirby').classList.remove('holstering');
  }, 200);
}

async function advanceRound() {
  levelReached++;
  if (levelReached >= attackers.length) {
    levelReached = 0;
  }
  loadAttacker(attackers[levelReached]);
  await callToFire();
}

function preloadImages() {
  let images = [];
  function preload() {
    for (i = 0; i < preload.arguments.length; i++) {
      images[i] = new Image();
      images[i].src = preload.arguments[i];
    }
    console.log('loaded', preload.arguments.length, 'images in', (Date.now() - jsStarted));
  }
  preload(
    '../media/images/kirby.png',
    '../media/images/kirbygun.png',
    '../media/images/kirbyhat2.png',
    '../media/images/waddledee.png',
    '../media/images/waddledeegun.png',
    '../media/images/waddledeehat.png',
    '../media/images/numbers.png',
  );
}

const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);