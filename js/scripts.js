const roundStatus = {
  drawStarted: false,
  attackerFired: false,
  fouled: false,
  won: false,
  startedAt: 0,
  playerSpeed: 0,
}

let pixelSize;

window.addEventListener('load', () => {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
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
  console.log('window loaded');
  document.getElementById('start-button').addEventListener('pointerdown', handleStartClick);
  document.getElementById('a-button').addEventListener('pointerdown', handleAClick);
});

async function handleStartClick(e) {
  document.body.classList.add('playing');
  await pause(1000); // wait for pan
  revealFighters();
  await pause(randomInt(1000, 2000));
  await startRound(500);
}

function handleAClick(e) {
  if (!roundStatus.drawStarted) {
    document.getElementById('game-message').innerText = 'FOUL!';
    document.getElementById('game-message').classList = ['foul'];
    roundStatus.fouled = true;
  } else if (!roundStatus.attackerFired) {
    document.getElementById('game-message').innerText = 'WIN!';
    document.getElementById('game-message').classList = ['win'];
    document.getElementById('kirby').style.backgroundImage = `url("media/images/kirbyfiring.png")`;
    document.getElementById('attacker').classList.add('defeated');
    roundStatus.won = true;
  }
  if (roundStatus.won) {
    let reactionTime = Date.now() - roundStatus.startedAt;
    document.getElementById('time-display').innerText = reactionTime + 'ms';
  }
}

function revealFighters() {
  document.getElementById('kirby').classList.add('visible');
  document.getElementById('attacker').classList.add('visible');
}

async function startRound(attackDelay) {
  roundStatus.startedAt = Date.now();
  document.getElementById('game-message').innerText = 'FIRE!';
  document.getElementById('game-message').classList = ['fire'];
  document.getElementById('attacker').style.backgroundImage = `url("media/images/waddledeefiring1.png")`;
  roundStatus.drawStarted = true;
  await pause(attackDelay);
  if (!roundStatus.won && !roundStatus.fouled) {
    document.getElementById('game-message').innerText = 'LOSE';
    document.getElementById('game-message').classList = ['lose'];
    document.getElementById('attacker').style.backgroundImage = `url("media/images/waddledeefiring2.png")`;
    document.getElementById('kirby').classList.add('defeated');
    roundStatus.attackerFired = true;
  }
}

const pause = async (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}