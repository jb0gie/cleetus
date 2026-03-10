/**
 * ContentCard Component - Individual card for stacked card system
 * Displays content sections with navigation controls
 */
export interface CardData {
  id: string;
  title: string;
  emoji?: string;
  content: HTMLElement[];
}

export class ContentCard extends HTMLElement {
  private cardData: CardData | null = null;
  private cardIndex = 0;
  private totalCards = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['index', 'total'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    if (name === 'index') this.cardIndex = parseInt(newValue, 10);
    if (name === 'total') this.totalCards = parseInt(newValue, 10);
    if (this.cardData) this.render();
  }

  set data(value: CardData) {
    this.cardData = value;
    this.render();
  }

  get data(): CardData | null {
    return this.cardData;
  }

  connectedCallback() {
    this.cardIndex = parseInt(this.getAttribute('index') || '0', 10);
    this.totalCards = parseInt(this.getAttribute('total') || '1', 10);
  }

  private render() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot || !this.cardData) return;

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

      .card {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(255, 0, 255, 0.2) 0%, rgba(255, 20, 147, 0.2) 100%);
        border-radius: 1rem;
        border: 2px solid rgba(255, 0, 255, 0.5);
        box-shadow: 0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-shrink: 0;
      }

      .card-emoji {
        font-size: 1.5rem;
      }

      .card-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: #ffff00;
        text-shadow: 0 0 15px #ff00ff;
        font-family: 'Poppins', sans-serif;
      }

      .card-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        line-height: 1.6;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 0, 255, 0.5) transparent;
      }

      .card-content::-webkit-scrollbar {
        width: 6px;
      }

      .card-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .card-content::-webkit-scrollbar-thumb {
        background: rgba(255, 0, 255, 0.5);
        border-radius: 3px;
      }

      .card-content ::slotted(h3) {
        font-size: 1rem;
        font-weight: 700;
        color: #ff69b4;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        font-family: 'Poppins', sans-serif;
      }

      .card-content ::slotted(h3:first-child) {
        margin-top: 0;
      }

      .card-content ::slotted(p) {
        font-size: 0.9rem;
        color: #ffffff;
        text-shadow: 0 0 3px rgba(255, 20, 147, 0.5);
        line-height: 1.6;
        margin-bottom: 0.75rem;
      }

      .card-content ::slotted(ul) {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0;
      }

      .card-content ::slotted(li) {
        font-size: 0.85rem;
        color: #ffffff;
        margin-bottom: 0.5rem;
        padding-left: 1.5rem;
        position: relative;
        line-height: 1.5;
      }

      .card-content ::slotted(li::before) {
        content: '→';
        position: absolute;
        left: 0.25rem;
        color: #ffff00;
        text-shadow: 0 0 10px #ff00ff;
        font-weight: 700;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 0, 255, 0.3);
        flex-shrink: 0;
      }

      .card-indicator {
        display: flex;
        gap: 0.5rem;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
      }

      .dot.active {
        background: #ffff00;
        box-shadow: 0 0 10px #ff00ff;
        transform: scale(1.2);
      }

      .card-counter {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
        font-family: 'Poppins', sans-serif;
      }

      @media (max-width: 768px) {
        .card {
          padding: 1.25rem;
        }

        .card-title {
          font-size: 1.1rem;
        }

        .card-content ::slotted(p) {
          font-size: 0.85rem;
        }
      }
    `;
    shadowRoot.appendChild(style);

    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';

    if (this.cardData.emoji) {
      const emoji = document.createElement('span');
      emoji.className = 'card-emoji';
      emoji.textContent = this.cardData.emoji;
      header.appendChild(emoji);
    }

    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = this.cardData.title;
    header.appendChild(title);

    const contentSlot = document.createElement('slot');
    contentSlot.name = 'content';

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'card-content';
    contentWrapper.appendChild(contentSlot);

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const indicator = document.createElement('div');
    indicator.className = 'card-indicator';
    for (let i = 0; i < this.totalCards; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i === this.cardIndex ? ' active' : '');
      indicator.appendChild(dot);
    }

    const counter = document.createElement('span');
    counter.className = 'card-counter';
    counter.textContent = `${this.cardIndex + 1} / ${this.totalCards}`;

    footer.appendChild(indicator);
    footer.appendChild(counter);

    card.appendChild(header);
    card.appendChild(contentWrapper);
    card.appendChild(footer);

    shadowRoot.appendChild(card);
  }
}

if (!customElements.get('content-card')) {
  customElements.define('content-card', ContentCard);
}
