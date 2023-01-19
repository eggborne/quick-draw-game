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
  console.log('clicked start');
  document.body.classList.add('playing');
  console.log('about to puase')
  await pause(1000);
  console.log('ended payse')
  document.getElementById('kirby').classList.add('visible');
  document.getElementById('attacker').classList.add('visible');
}

function handleAClick(e) {
  console.log('clicked A');
}

const pause = async (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}