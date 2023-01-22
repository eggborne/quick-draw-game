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
      'dead1',
      'dead2',
      'dead3',
      'disappointed',
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
  document.body.classList.add('playing');
  initiateRound(levelReached);
}

async function initiateRound(level) {
  loadAttacker(attackers[level]);
  await pause(options.introPanSpeed);
  document.getElementById('kirby').classList.add('visible');
  document.getElementById('attacker').classList.add('visible');
  document.getElementById('kirby-hat').style.opacity = 1;
  document.getElementById('attacker-hat').style.opacity = 1;
  let suspenseTime = randomInt(attackers[level].suspenseTime.min, attackers[level].suspenseTime.max);
  await pause(suspenseTime);
  if (!roundStatus.fouled) {
    callToFire();
  }  
}

async function endRound() {
  document.getElementById('kirby').classList.remove('visible');
  document.getElementById('attacker').classList.remove('visible');
  await pause(1000);
  document.getElementById('battle-area').classList.add('dimmed');
  await pause(500);
  document.getElementById('battle-area').classList.remove('dimmed');
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
  console.warn('bonus', bonus);
  roundStatus.bonusRank = bonus.rank;
  player.score += bonus.points;
  await pause(300);
  if (bonus.rank) {
    changeBonusMessage('bonus');
  } else {
    changeBonusMessage('nobonus');
  }
  await pause(500);
  changeFrame('kirby', 'waiting');
  changeBG('#kirby + .hat', 'media/images/kirbyhat.png');
  document.querySelector('#kirby > .gun').classList.remove('drawn');
  await pause(200);
  changeFrame('kirby', 'drawing');
  changeBG('#kirby + .hat', 'media/images/kirbyhat2.png');
  document.querySelector('#kirby > .gun').classList.add('spinning');
  changeBG('#kirby > .gun', 'media/images/spinninggun.png');
  let spinTime = randomInt(500, 2000);
  document.querySelector('#kirby > .gun').style.animationDuration = spinTime + 'ms';
  await pause(spinTime);
  document.querySelector('#kirby > .gun').classList.remove('spinning');
  document.querySelector('#kirby > .gun').classList.remove('drawn');
  changeFrame('kirby', 'waiting');
  changeBG('#kirby + .hat', 'media/images/kirbyhat.png');
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

function changeGameMessage(newMessage) {
  if (newMessage) {
    document.getElementById('game-message').style.opacity = '1';
    document.getElementById('game-message').style.backgroundImage = `url("media/images/${newMessage}.png")`;
  } else {
    document.getElementById('game-message').style.opacity = '0';
  }
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

function changeBonusMessage(newMessage) {
  if (newMessage) {
    document.getElementById('bonus-message').style.opacity = '1';
    document.getElementById('bonus-message').style.backgroundImage = `url("media/images/${newMessage}.png")`;
    if (roundStatus.bonusRank) {
      // document.getElementById('bonus-message').style.backgroundImage = `url("media/images/rank-${roundStatus.bonusRank}.png")`;
      document.getElementById('bonus-message').classList.add(`rank-${roundStatus.bonusRank}`);
    }
  } else {
    document.getElementById('bonus-message').style.opacity = '0';
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
  document.getElementById('attacker-hat').style.height = actualSize.height/2 + 'px';
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
    document.querySelector('#attacker > .gun').classList.add('drawn');
    document.getElementById('kirby').classList.add('defeated');
    document.querySelector('#kirby + .hat').classList.add('defeated');
    roundStatus.attackerFired = true;
  }
}

async function advanceRound() {
  levelReached++;
  if (levelReached >= attackers.length) {
    levelReached = 0;
  }
  loadAttacker(attackers[levelReached]);
  await callToFire();
}

const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);