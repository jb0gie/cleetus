import './ModelViewer';
import './CardStack';
import { loadAboutContent } from '../lib/contentLoader';
import type { CardData } from './ContentCard';
import type { CardStack } from './CardStack';

/**
 * AvatarShowcase Component - Side-by-side layout
 *
 * Desktop: Model viewer on the right (full background), stacked cards on the left
 * Mobile: Model viewer as full background, cards overlaid on top
 * Pink/magenta gradient theme, chill vibes
 */
export class AvatarShowcase extends HTMLElement {
  private cards: CardData[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.loadContent();
  }

  private loadContent() {
    try {
      this.cards = loadAboutContent();
      this.updateCardStack();
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }

  private updateCardStack() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    const cardStack = shadowRoot.querySelector('card-stack') as CardStack;
    if (cardStack && this.cards.length > 0) {
      cardStack.data = this.cards;
    }
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

      .container {
        width: 100%;
        min-height: 100vh;
        background: linear-gradient(135deg, #ff00ff 0%, #ff1493 25%, #ff69b4 50%, #ff1493 75%, #ff00ff 100%);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      /* Main layout */
      .main-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        align-items: stretch;
        position: relative;
        min-height: 100vh;
      }

      /* Left side: content */
      .content-side {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 2rem 3rem;
        z-index: 10;
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.7) 0%,
          rgba(0, 0, 0, 0.4) 50%,
          transparent 100%
        );
        pointer-events: none;
        height: 100%;
      }

      .content-side > * {
        pointer-events: auto;
      }

      .content-inner {
        max-width: 28rem;
        margin: 0 auto;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      /* Header */
      .header {
        text-align: center;
        flex-shrink: 0;
      }

      .header-emoji {
        font-size: 3rem;
        display: block;
        margin-bottom: 0.5rem;
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      h1 {
        font-size: 3rem;
        font-weight: 900;
        color: #ffffff;
        text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff1493;
        margin-bottom: 0.5rem;
        font-family: 'Poppins', sans-serif;
        line-height: 1.1;
      }

      .subtitle {
        font-size: 1rem;
        color: #ffff00;
        text-shadow: 0 0 10px #ff1493;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
      }

      /* Card Stack Container */
      .card-stack-container {
        flex: 1;
        min-height: 0;
      }

      card-stack {
        width: 100%;
        height: 100%;
      }

      /* Right side: avatar viewer */
      .viewer-side {
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        overflow: hidden;
        background: transparent;
      }

      .viewer-container {
        width: 100%;
        height: 100%;
        position: relative;
        background: transparent;
      }

      model-viewer {
        width: 100%;
        height: 100%;
        background: transparent;
      }

      /* Desktop: side-by-side */
      @media (min-width: 1025px) {
        .viewer-side {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1;
        }

        .main-layout {
          position: relative;
          z-index: 10;
        }

        .content-side {
          min-height: 100vh;
          padding: 3rem 4rem;
        }
      }

      /* Mobile/Tablet: Model underneath, text overlay */
      @media (max-width: 1024px) {
        .container {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
        }

        .main-layout {
          display: block;
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
        }

        .viewer-side {
          position: fixed;
          inset: 0;
          z-index: 1;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
        }

        .viewer-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        model-viewer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .content-side {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          min-height: 100dvh;
          justify-content: center;
          padding: 0.75rem;
          padding-top: 1.5rem;
          padding-bottom: 1rem;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.7) 30%,
            rgba(0, 0, 0, 0.4) 60%,
            transparent 100%
          );
          pointer-events: none;
        }

        .content-side > * {
          pointer-events: auto;
        }

        .content-inner {
          max-width: 100%;
          margin: 0;
          height: auto;
          min-height: unset;
          max-height: calc(100vh - 2rem);
          max-height: calc(100dvh - 2rem);
        }

        .card-stack-container {
          flex: 0 0 auto;
          min-height: unset;
          height: auto;
          max-height: 45vh;
          max-height: 45dvh;
        }

        card-stack {
          height: 100%;
        }

        h1 {
          font-size: 2rem;
        }
      }

      /* Small Mobile */
      @media (max-width: 640px) {
        .content-side {
          padding: 0.5rem;
          padding-top: 1rem;
          padding-bottom: 0.75rem;
        }

        .content-inner {
          gap: 0.75rem;
        }

        .header-emoji {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        h1 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .subtitle {
          font-size: 0.85rem;
        }

        .card-stack-container {
          max-height: 50vh;
          max-height: 50dvh;
        }
      }
    `;
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'container';

    // Main layout
    const mainLayout = document.createElement('div');
    mainLayout.className = 'main-layout';

    // Left side: content with card stack
    const contentSide = document.createElement('div');
    contentSide.className = 'content-side';

    const contentInner = document.createElement('div');
    contentInner.className = 'content-inner';

    // Header
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
      <span class="header-emoji">🤡</span>
      <h1>Yo, I'm Cleetus</h1>
      <p class="subtitle">Pink demi-humanoid. Former SpiceX test subject.</p>
    `;

    // Card Stack Container
    const cardStackContainer = document.createElement('div');
    cardStackContainer.className = 'card-stack-container';

    const cardStack = document.createElement('card-stack');
    cardStackContainer.appendChild(cardStack);

    contentInner.appendChild(header);
    contentInner.appendChild(cardStackContainer);
    contentSide.appendChild(contentInner);

    // Right side: avatar viewer
    const viewerSide = document.createElement('div');
    viewerSide.className = 'viewer-side';

    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'viewer-container';

    const modelViewer = document.createElement('model-viewer');
    modelViewer.setAttribute('environment', 'studio');
    modelViewer.setAttribute('shadows', 'true');

    viewerContainer.appendChild(modelViewer);
    viewerSide.appendChild(viewerContainer);

    // Assemble
    mainLayout.appendChild(contentSide);
    mainLayout.appendChild(viewerSide);
    container.appendChild(mainLayout);
    shadowRoot.appendChild(container);
  }
}

// Register the custom element
if (!customElements.get('avatar-showcase')) {
  customElements.define('avatar-showcase', AvatarShowcase);
}
