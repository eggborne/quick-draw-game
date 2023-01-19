const roundStatus = {
  drawStarted: false
}

window.addEventListener('load', () => {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  let pixelWidth = 170;
  let pixelHeight = 150;
  let pixelSize = (window.innerWidth / pixelWidth);
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
  await pause(1000);
  revealFighters();
  startRound(1000);
}

function handleAClick(e) {
  if (!roundStatus.drawStarted) {
    document.getElementById('game-message').innerText = 'FOUL!';
    document.getElementById('game-message').classList = ['foul'];

  }
}

function revealFighters() {
  document.getElementById('kirby').classList.add('visible');
  document.getElementById('attacker').classList.add('visible');
}

async function startRound(attackDelay) {
  let currentAttacker = attackers[levelRea]
  await pause(attackDelay);
  document.getElementById('game-message').innerText = 'FIRE!';
  document.getElementById('game-message').classList = ['fire'];
  await pause()
  roundStatus.drawStarted = true;
}

const pause = async (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}