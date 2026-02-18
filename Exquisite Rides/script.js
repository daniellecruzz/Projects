let currentSlide = 0;
const slider = document.getElementById('sliderWrapper');
const cards = document.querySelectorAll('.car-card');
const totalCards = cards.length;

// How many cards to show at once
let cardsToShow = 3;

// Adjust cards to show based on screen size
function updateCardsToShow() {
  if (window.innerWidth <= 768) {
    cardsToShow = 1;
  } else if (window.innerWidth <= 1024) {
    cardsToShow = 2;
  } else {
    cardsToShow = 3;
  }
}

function slideRight() {
  updateCardsToShow();
  if (currentSlide < totalCards - cardsToShow) {
    currentSlide++;
    updateSlider();
  }
}

function slideLeft() {
  updateCardsToShow();
  if (currentSlide > 0) {
    currentSlide--;
    updateSlider();
  }
}

function updateSlider() {
  const cardWidth = cards[0].offsetWidth;
  const gap = 30;
  const offset = -(currentSlide * (cardWidth + gap));
  slider.style.transform = `translateX(${offset}px)`;
}

// Update on window resize
window.addEventListener('resize', () => {
  updateCardsToShow();
  updateSlider();
});

// Initialize
updateCardsToShow();