const options = {
  introPanSpeed: 1200,
  suspenseTime: { min: 1000, max: 2000 },
  bonusAmounts: [ 0, 1000, 3000, 5000 ],
}

const attackers = [
  {
    name: 'waddledee',
    drawSpeed: 800,
    width: 24,
    height: 24,
  },
  {
    name: 'chicken',
    drawSpeed: 400,
    width: 24,
    height: 28,
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
  pixelSize = (window.innerWidth / pixelWidth);
  let gameScreenHeight = Math.round(pixelSize * pixelHeight);
  console.warn('pixelSize:', pixelSize);
  console.warn('gameScreenHeight = ' + gameScreenHeight);
  let spriteHeight = Math.round(pixelSize * 24);
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
  let suspenseTime = randomInt(options.suspenseTime.min, options.suspenseTime.max);
  await pause(suspenseTime);
  callToFire();
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
      roundStatus.fouled = true;
    } else if (!roundStatus.attackerFired) {
      defeatAttacker();
    }
  }
}

async function defeatAttacker() {
  changeGameMessage('win');
  document.getElementById('kirby').style.backgroundImage = `url("media/images/kirbyfiring.png")`;
  document.getElementById('attacker').classList.add('defeated');
  roundStatus.won = true;
  let reactionTime = Date.now() - roundStatus.startedAt;
  document.getElementById('time-display').innerText = reactionTime + 'ms';
  let bonusRank = 0;
  let bonusLimits = [
    (attackers[levelReached].drawSpeed * 0.3),
    (attackers[levelReached].drawSpeed * 0.45),
    (attackers[levelReached].drawSpeed * 0.6),
  ];
  console.table(bonusLimits);
  if (reactionTime <= bonusLimits[0]) {
    bonusRank = 3;
  } else if (reactionTime <= bonusLimits[1]) {
    bonusRank = 2;
  } else if (reactionTime <= bonusLimits[2]) {
    bonusRank = 1;
  }
  let bonusPoints = options.bonusAmounts[bonusRank];
  let timeToSpare = (attackers[levelReached].drawSpeed - reactionTime);
  let spareBonus = timeToSpare * (bonusRank/2);
  bonusPoints += spareBonus;
  console.warn('bonusPoints', bonusPoints);
  roundStatus.bonusRank = bonusRank;
  await pause(300);
  if (bonusRank) {
    changeBonusMessage('bonus');
  } else {
    changeBonusMessage('nobonus');
  }
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
  attackerElement.style.backgroundImage = `url(../media/images/${attacker.name}waiting.png)`;
  console.log('width to', Math.round(pixelSize * attacker.width) + 'px')
  console.log('height to', Math.round(pixelSize * attacker.height) + 'px')
  attackerElement.style.width = Math.round(pixelSize * attacker.width) + 'px';
  attackerElement.style.height = Math.round(pixelSize * attacker.height) + 'px';
}

async function callToFire() {
  let attackDelay = attackers[levelReached].drawSpeed;
  console.warn('starting round with', attackers[levelReached].name, attackDelay)
  roundStatus.startedAt = Date.now();
  changeGameMessage('fire');
  document.getElementById('a-button').classList.remove('dimmed');
  setTimeout(() => {
    changeGameMessage();
    document.getElementById('a-button').classList.add('dimmed');
  }, attackDelay);
  document.getElementById('attacker').style.backgroundImage = `url("media/images/${attackers[levelReached].name}firing1.png")`;
  roundStatus.drawStarted = true;
  console.warn('attack delay starting...', attackDelay);
  await pause(attackDelay);
  console.warn('attack delay over', attackDelay);
  if (!roundStatus.won && !roundStatus.fouled) {
    document.getElementById('attacker').style.backgroundImage = `url("media/images/${attackers[levelReached].name}firing2.png")`;
    document.getElementById('kirby').classList.add('defeated');
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

const pause = async (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);