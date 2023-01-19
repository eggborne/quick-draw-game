window.addEventListener('load', () => {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  let pixelSize = (window.innerWidth / 170);
  gameScreenHeight = Math.round(pixelSize * 120);
  spriteHeight = Math.round(pixelSize * 28);
  console.warn('pixelSize:', pixelSize);
  document.documentElement.style.setProperty('--nes-pixel-size', pixelSize + 'px');
  document.documentElement.style.setProperty('--game-screen-height', gameScreenHeight + 'px');
  document.documentElement.style.setProperty('--sprite-height', spriteHeight + 'px');
  console.log('window loaded');
  document.querySelector('main').addEventListener('pointerdown', handleClick);
});

function handleClick() {
  console.log('event', event)
}
