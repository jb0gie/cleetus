import './ModelViewer';
import './CardStack';
import { loadAboutContent } from '../lib/contentLoader';
import type { CardData } from './ContentCard';
import type { CardStack } from './CardStack';

/**
 * AvatarShowcase Component - Side-by-side layout
 *
 * Model viewer on the right (full background), stacked cards on the left
 * Pink/magenta gradient theme, chill vibes
 */
export class AvatarShowcase extends HTMLElement {
  private cards: CardData[] = [];
  private modelViewer: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.loadContent();
    this.setupAnimationControls();
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

  private setupAnimationControls() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    this.modelViewer = shadowRoot.querySelector('model-viewer');
    const animSelect = shadowRoot.querySelector('#anim-select') as HTMLSelectElement;

    if (animSelect && this.modelViewer) {
      animSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const anim = target.value;
        if (anim && this.modelViewer) {
          this.modelViewer.setAttribute('animation', anim);
        }
      });
    }

    // Update available animations when model loads
    if (this.modelViewer) {
      this.modelViewer.addEventListener('model-loaded', () => {
        this.populateAnimationDropdown();
      });
    }
  }

  private populateAnimationDropdown() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    const animSelect = shadowRoot.querySelector('#anim-select') as HTMLSelectElement;
    const modelViewer = shadowRoot.querySelector('model-viewer') as any;

    if (animSelect && modelViewer && modelViewer.getAvailableAnimations) {
      const animations = modelViewer.getAvailableAnimations();
      animSelect.innerHTML = '<option value="">Select Animation...</option>' +
        animations.map((anim: string) => `<option value="${anim}">${anim}</option>`).join('');
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

      /* Main layout: 3D as full background, content overlaid */
      .main-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        align-items: stretch;
        position: relative;
        background: transparent;
        pointer-events: none;
      }

      .main-layout > * {
        pointer-events: auto;
      }

      /* Left side: content with subtle backdrop */
      .content-side {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 2rem 3rem;
        z-index: 10;
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.6) 0%,
          rgba(0, 0, 0, 0.3) 50%,
          transparent 100%
        );
        pointer-events: none;
      }

      .content-side > * {
        pointer-events: auto;
      }

      .content-inner {
        max-width: 28rem;
        margin: 0 auto;
        width: 100%;
      }

      /* Header */
      .header {
        text-align: center;
        margin-bottom: 1.5rem;
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
        height: 380px;
        margin-bottom: 1.5rem;
      }

      card-stack {
        width: 100%;
        height: 100%;
      }

      /* Animation Controls */
      .controls-panel {
        background: rgba(255, 0, 255, 0.2);
        backdrop-filter: blur(0.5rem);
        border-radius: 1rem;
        padding: 1rem 1.5rem;
        border: 2px solid #ff00ff;
        box-shadow: 0 0 20px #ff00ff, inset 0 0 20px rgba(255, 20, 147, 0.3);
      }

      .controls-panel h3 {
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #ffff00;
        text-shadow: 0 0 10px #ff00ff;
        margin-bottom: 0.75rem;
        letter-spacing: 0.05em;
        font-family: 'Poppins', sans-serif;
      }

      .anim-select {
        width: 100%;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #ff00ff;
        border-radius: 0.5rem;
        padding: 0.5rem;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.85rem;
        cursor: pointer;
        outline: none;
      }

      .anim-select option {
        background: #1a1a2e;
        color: #ffffff;
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

      /* Desktop: 3D as full background */
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

      /* Tablet */
      @media (max-width: 1024px) {
        .main-layout {
          grid-template-columns: 1fr;
        }

        .content-side {
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.4) 50%,
            rgba(0, 0, 0, 0.2) 100%
          );
          padding: 2rem;
          min-height: auto;
        }

        .content-inner {
          max-width: 500px;
        }

        .viewer-side {
          height: 50vh;
          min-height: 400px;
        }

        h1 {
          font-size: 2.5rem;
        }
      }

      /* Mobile */
      @media (max-width: 640px) {
        .content-side {
          padding: 1.5rem;
        }

        .header-emoji {
          font-size: 2.5rem;
        }

        h1 {
          font-size: 2rem;
        }

        .card-stack-container {
          height: 350px;
        }

        .viewer-side {
          height: 45vh;
          min-height: 350px;
        }
      }
    `;
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'container';

    // Main layout: content on left, viewer on right
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

    // Controls Panel
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'controls-panel';
    controlsPanel.innerHTML = `
      <h3>Animation</h3>
      <select id="anim-select" class="anim-select">
        <option value="">Select Animation...</option>
      </select>
    `;

    contentInner.appendChild(header);
    contentInner.appendChild(cardStackContainer);
    contentInner.appendChild(controlsPanel);
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
