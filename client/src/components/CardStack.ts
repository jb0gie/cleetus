import './ContentCard';
import { ContentCard, type CardData } from './ContentCard';

/**
 * CardStack Component - Stacked card navigation system
 * Allows users to cycle through content cards with smooth animations
 */
export class CardStack extends HTMLElement {
  private cards: CardData[] = [];
  private currentIndex = 0;
  private touchStartX = 0;
  private touchEndX = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set data(cards: CardData[]) {
    this.cards = cards;
    this.currentIndex = 0;
    this.render();
  }

  connectedCallback() {
    this.render();
    this.setupKeyboardNavigation();
    this.setupTouchNavigation();
  }

  private setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousCard();
      if (e.key === 'ArrowRight') this.nextCard();
    });
  }

  private setupTouchNavigation() {
    this.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  private handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextCard();
      } else {
        this.previousCard();
      }
    }
  }

  private nextCard() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.updateDisplay();
    }
  }

  private previousCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateDisplay();
    }
  }

  private updateDisplay() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    const cardsContainer = shadowRoot.querySelector('.cards-container');
    const prevButton = shadowRoot.querySelector('.nav-button.prev');
    const nextButton = shadowRoot.querySelector('.nav-button.next');

    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      this.renderCurrentCard(cardsContainer);
    }

    if (prevButton) {
      prevButton.classList.toggle('disabled', this.currentIndex === 0);
    }
    if (nextButton) {
      nextButton.classList.toggle('disabled', this.currentIndex === this.cards.length - 1);
    }
  }

  private renderCurrentCard(container: Element) {
    const cardData = this.cards[this.currentIndex];
    if (!cardData) return;

    const contentCard = document.createElement('content-card') as ContentCard;
    contentCard.setAttribute('index', String(this.currentIndex));
    contentCard.setAttribute('total', String(this.cards.length));
    contentCard.data = cardData;

    const contentSlot = document.createElement('div');
    contentSlot.setAttribute('slot', 'content');
    cardData.content.forEach(el => contentSlot.appendChild(el.cloneNode(true)));

    contentCard.appendChild(contentSlot);
    container.appendChild(contentCard);
  }

  private render() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    shadowRoot.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .card-stack {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .cards-container {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 3rem;
      }

      content-card {
        width: 100%;
        max-width: 600px;
        height: 100%;
        max-height: 500px;
        animation: slideIn 0.4s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .nav-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff00ff 0%, #ff1493 100%);
        border: 2px solid #ffffff;
        color: #ffffff;
        font-size: 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px #ff00ff, 0 4px 10px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        z-index: 10;
      }

      .nav-button:hover:not(.disabled) {
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 0 25px #ff00ff, 0 6px 15px rgba(0, 0, 0, 0.4);
      }

      .nav-button.disabled {
        opacity: 0.3;
        cursor: not-allowed;
        box-shadow: none;
      }

      .nav-button.prev {
        left: 0.5rem;
      }

      .nav-button.next {
        right: 0.5rem;
      }

      .card-hint {
        text-align: center;
        padding: 0.75rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Poppins', sans-serif;
      }

      .card-hint span {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }

      @media (max-width: 768px) {
        .cards-container {
          padding: 0 2.5rem;
        }

        content-card {
          max-height: 450px;
        }

        .nav-button {
          width: 38px;
          height: 38px;
          font-size: 1rem;
        }

        .nav-button.prev {
          left: 0.25rem;
        }

        .nav-button.next {
          right: 0.25rem;
        }
      }

      @media (max-width: 480px) {
        content-card {
          max-height: 400px;
        }
      }
    `;
    shadowRoot.appendChild(style);

    const cardStack = document.createElement('div');
    cardStack.className = 'card-stack';

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    this.renderCurrentCard(cardsContainer);

    const prevButton = document.createElement('button');
    prevButton.className = 'nav-button prev' + (this.currentIndex === 0 ? ' disabled' : '');
    prevButton.innerHTML = '&#8249;';
    prevButton.setAttribute('aria-label', 'Previous card');
    prevButton.addEventListener('click', () => this.previousCard());

    const nextButton = document.createElement('button');
    nextButton.className = 'nav-button next' + (this.currentIndex === this.cards.length - 1 ? ' disabled' : '');
    nextButton.innerHTML = '&#8250;';
    nextButton.setAttribute('aria-label', 'Next card');
    nextButton.addEventListener('click', () => this.nextCard());

    const hint = document.createElement('div');
    hint.className = 'card-hint';
    hint.innerHTML = '<span>← Swipe or use arrows →</span>';

    cardStack.appendChild(cardsContainer);
    cardStack.appendChild(prevButton);
    cardStack.appendChild(nextButton);
    cardStack.appendChild(hint);

    shadowRoot.appendChild(cardStack);
  }
}

if (!customElements.get('card-stack')) {
  customElements.define('card-stack', CardStack);
}
