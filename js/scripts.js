window.addEventListener('load', () => {
  console.log('window loaded');
  document.querySelector('main').addEventListener('pointerdown', handleClick);
});

function handleClick() {
  console.log('event', event)
}
