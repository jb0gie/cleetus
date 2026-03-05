import './VRMViewer';

/**
 * AvatarShowcase Component - Mobile-First Design
 * 
 * Cleetus leans against the right side of the screen like a wall
 * Creates a dynamic, playful composition that works beautifully on mobile
 */
export class AvatarShowcase extends HTMLElement {
  // Use local Cleetus.vrm file
  private modelUrl = '/Cleetus.vrm';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

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
        background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      /* Main layout: content on left, avatar viewer on right */
      .main-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        align-items: stretch;
        position: relative;
      }

      /* Left side: content */
      .content-side {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 2rem;
        z-index: 10;
      }

      .content-inner {
        max-width: 28rem;
      }

      h1 {
        font-size: 3.5rem;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 0.5rem;
        font-family: 'Poppins', sans-serif;
        line-height: 1.1;
      }

      .subtitle {
        font-size: 1rem;
        color: #6b7280;
        margin-bottom: 1.5rem;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
      }

      .description {
        font-size: 0.95rem;
        color: #4b5563;
        line-height: 1.7;
        margin-bottom: 2rem;
        font-family: 'Poppins', sans-serif;
      }

      .controls-list {
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(0.5rem);
        border-radius: 1rem;
        padding: 1.5rem;
        border: 1px solid rgba(244, 114, 182, 0.3);
        margin-bottom: 1.5rem;
      }

      .controls-list h3 {
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #be185d;
        margin-bottom: 1rem;
        letter-spacing: 0.05em;
        font-family: 'Poppins', sans-serif;
      }

      .controls-list ul {
        list-style: none;
        padding: 0;
      }

      .controls-list li {
        font-size: 0.9rem;
        color: #4b5563;
        margin-bottom: 0.75rem;
        padding-left: 1.5rem;
        position: relative;
        font-family: 'Poppins', sans-serif;
      }

      .controls-list li:last-child {
        margin-bottom: 0;
      }

      .controls-list li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: #ec4899;
        font-weight: 700;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .info-card {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 0.875rem;
        padding: 1rem;
        border: 1px solid rgba(244, 114, 182, 0.2);
      }

      .info-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 0.5rem;
        letter-spacing: 0.05em;
        font-family: 'Poppins', sans-serif;
      }

      .info-value {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1f2937;
        font-family: 'Poppins', sans-serif;
      }

      /* Right side: avatar viewer */
      .viewer-side {
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        overflow: hidden;
      }

      .viewer-container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      vrm-viewer {
        width: 100%;
        height: 100%;
      }

      /* Decorative elements */
      .accent-shape {
        position: absolute;
        border-radius: 50%;
        opacity: 0.1;
        pointer-events: none;
      }

      .shape-1 {
        width: 20rem;
        height: 20rem;
        background: #d97706;
        top: -5rem;
        right: -5rem;
      }

      .shape-2 {
        width: 15rem;
        height: 15rem;
        background: #10b981;
        bottom: 2rem;
        left: -3rem;
      }

      /* Footer */
      footer {
        border-top: 1px solid rgba(244, 114, 182, 0.3);
        background: rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(0.5rem);
        padding: 1.5rem;
        text-align: center;
      }

      footer p {
        color: #6b7280;
        font-size: 0.8rem;
        font-family: 'Poppins', sans-serif;
        margin: 0.25rem 0;
      }

      /* Mobile responsiveness */
      @media (max-width: 1024px) {
        .main-layout {
          grid-template-columns: 1fr;
        }

        .content-side {
          padding: 2rem 1.5rem;
          justify-content: flex-start;
          padding-top: 3rem;
        }

        .viewer-side {
          min-height: 24rem;
          align-items: center;
          justify-content: center;
        }

        h1 {
          font-size: 2.5rem;
        }

        .content-inner {
          max-width: 100%;
        }
      }

      @media (max-width: 640px) {
        .container {
          min-height: auto;
        }

        .main-layout {
          min-height: auto;
        }

        .content-side {
          padding: 1.5rem 1rem;
          padding-top: 2rem;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .description {
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .viewer-side {
          min-height: 18rem;
        }

        .info-grid {
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .info-card {
          padding: 0.75rem;
        }

        .info-label {
          font-size: 0.65rem;
        }

        .info-value {
          font-size: 0.85rem;
        }

        .controls-list {
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .controls-list h3 {
          font-size: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .controls-list li {
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          padding-left: 1.25rem;
        }

        footer {
          padding: 1rem;
        }

        footer p {
          font-size: 0.7rem;
        }
      }
    `;
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'container';

    // Decorative shapes
    const shape1 = document.createElement('div');
    shape1.className = 'accent-shape shape-1';
    
    const shape2 = document.createElement('div');
    shape2.className = 'accent-shape shape-2';

    // Main layout
    const mainLayout = document.createElement('div');
    mainLayout.className = 'main-layout';

    // Left side: Content
    const contentSide = document.createElement('div');
    contentSide.className = 'content-side';

    const contentInner = document.createElement('div');
    contentInner.className = 'content-inner';

    const h1 = document.createElement('h1');
    h1.textContent = 'Cleetus';

    const subtitle = document.createElement('div');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Interactive 3D Avatar';

    const description = document.createElement('p');
    description.className = 'description';
    description.textContent = 'Meet Cleetus, a unique avatar ready to interact with you. Rotate, zoom, and explore every detail in stunning 3D.';

    const controlsList = document.createElement('div');
    controlsList.className = 'controls-list';

    const controlsH3 = document.createElement('h3');
    controlsH3.textContent = 'How to interact';

    const controlsUl = document.createElement('ul');
    
    const li1 = document.createElement('li');
    li1.textContent = 'Drag to rotate';
    
    const li2 = document.createElement('li');
    li2.textContent = 'Scroll to zoom';
    
    const li3 = document.createElement('li');
    li3.textContent = 'Enjoy the experience';

    controlsUl.appendChild(li1);
    controlsUl.appendChild(li2);
    controlsUl.appendChild(li3);

    controlsList.appendChild(controlsH3);
    controlsList.appendChild(controlsUl);

    const infoGrid = document.createElement('div');
    infoGrid.className = 'info-grid';

    // Creator card
    const creatorCard = document.createElement('div');
    creatorCard.className = 'info-card';
    const creatorLabel = document.createElement('div');
    creatorLabel.className = 'info-label';
    creatorLabel.textContent = 'Creator';
    const creatorValue = document.createElement('div');
    creatorValue.className = 'info-value';
    creatorValue.textContent = 'VRoid';
    creatorCard.appendChild(creatorLabel);
    creatorCard.appendChild(creatorValue);

    // License card
    const licenseCard = document.createElement('div');
    licenseCard.className = 'info-card';
    const licenseLabel = document.createElement('div');
    licenseLabel.className = 'info-label';
    licenseLabel.textContent = 'License';
    const licenseValue = document.createElement('div');
    licenseValue.className = 'info-value';
    licenseValue.textContent = 'CC0';
    licenseCard.appendChild(licenseLabel);
    licenseCard.appendChild(licenseValue);

    infoGrid.appendChild(creatorCard);
    infoGrid.appendChild(licenseCard);

    contentInner.appendChild(h1);
    contentInner.appendChild(subtitle);
    contentInner.appendChild(description);
    contentInner.appendChild(controlsList);
    contentInner.appendChild(infoGrid);

    contentSide.appendChild(contentInner);

    // Right side: Avatar Viewer
    const viewerSide = document.createElement('div');
    viewerSide.className = 'viewer-side';

    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'viewer-container';

    const vrmViewer = document.createElement('vrm-viewer');
    vrmViewer.setAttribute('model-url', this.modelUrl);

    viewerContainer.appendChild(vrmViewer);
    viewerSide.appendChild(viewerContainer);

    mainLayout.appendChild(contentSide);
    mainLayout.appendChild(viewerSide);

    // Footer
    const footer = document.createElement('footer');
    const footerP1 = document.createElement('p');
    footerP1.textContent = 'Cleetus Avatar Showcase';
    const footerP2 = document.createElement('p');
    footerP2.textContent = 'Built with webJSX & Three.js';
    footer.appendChild(footerP1);
    footer.appendChild(footerP2);

    container.appendChild(shape1);
    container.appendChild(shape2);
    container.appendChild(mainLayout);
    container.appendChild(footer);

    shadowRoot.appendChild(container);
  }
}

// Register the custom element
if (!customElements.get('avatar-showcase')) {
  customElements.define('avatar-showcase', AvatarShowcase);
}
