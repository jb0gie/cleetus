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
        background: linear-gradient(135deg, #ff00ff 0%, #ff1493 25%, #ff69b4 50%, #ff1493 75%, #ff00ff 100%);
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
        background: transparent;
      }

      /* Left side: content */
      .content-side {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 2rem 3rem;
        z-index: 10;
        background: transparent;
      }

      .content-inner {
        max-width: 28rem;
        margin: 0 auto;
      }

      h1 {
        font-size: 4rem;
        font-weight: 900;
        color: #ffffff;
        text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff1493;
        margin-bottom: 0.5rem;
        font-family: 'Poppins', sans-serif;
        line-height: 1.1;
      }

      .subtitle {
        font-size: 1.2rem;
        color: #ffff00;
        text-shadow: 0 0 10px #ff1493;
        margin-bottom: 1.5rem;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
      }

      .description {
        font-size: 1rem;
        color: #ffffff;
        text-shadow: 0 0 5px #ff1493;
        line-height: 1.7;
        margin-bottom: 2rem;
        font-family: 'Poppins', sans-serif;
      }

      .controls-list {
        background: rgba(255, 0, 255, 0.2);
        backdrop-filter: blur(0.5rem);
        border-radius: 1rem;
        padding: 1.5rem;
        border: 2px solid #ff00ff;
        box-shadow: 0 0 20px #ff00ff, inset 0 0 20px rgba(255, 20, 147, 0.3);
        margin-bottom: 1.5rem;
      }

      .controls-list h3 {
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #ffff00;
        text-shadow: 0 0 10px #ff00ff;
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
        color: #ffffff;
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
        color: #ffff00;
        text-shadow: 0 0 10px #ff00ff;
        font-weight: 700;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .info-card {
        background: rgba(255, 0, 255, 0.2);
        border-radius: 0.875rem;
        padding: 1rem;
        border: 2px solid #ff00ff;
        box-shadow: 0 0 15px #ff00ff;
      }

      .info-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #ffff00;
        margin-bottom: 0.5rem;
        letter-spacing: 0.05em;
        font-family: 'Poppins', sans-serif;
      }

      .info-value {
        font-size: 0.95rem;
        font-weight: 600;
        color: #ffffff;
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

      vrm-viewer {
        width: 100%;
        height: 100%;
        background: transparent;
      }

      /* Footer */
      footer {
        border-top: 2px solid #ff00ff;
        background: rgba(255, 0, 255, 0.15);
        box-shadow: 0 0 30px #ff00ff;
        backdrop-filter: blur(0.5rem);
        padding: 1.5rem;
        text-align: center;
      }

      footer p {
        color: #ffffff;
        text-shadow: 0 0 5px #ff1493;
        font-size: 0.8rem;
        font-family: 'Poppins', sans-serif;
        margin: 0.25rem 0;
      }

      /* Mobile: VRM as full background, text overlaid */
      @media (max-width: 1024px) {
        .main-layout {
          display: block;
          position: relative;
          min-height: 100vh;
        }

        .viewer-side {
          position: absolute;
          inset: 0;
          z-index: 1;
          min-height: 100vh;
        }

        .viewer-container {
          position: absolute;
          inset: 0;
        }

        vrm-viewer {
          position: absolute;
          inset: 0;
        }

        .content-side {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          justify-content: flex-end;
          padding: 2rem;
          padding-bottom: 6rem;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 0.4) 40%,
            rgba(0, 0, 0, 0.1) 70%,
            transparent 100%
          );
        }

        .content-inner {
          max-width: 100%;
          margin: 0;
        }

        h1 {
          font-size: 3rem;
        }
      }

      @media (max-width: 640px) {
        .content-side {
          padding: 1.5rem;
          padding-bottom: 5rem;
        }

        h1 {
          font-size: 2.5rem;
        }

        .subtitle {
          font-size: 1rem;
        }

        .description {
          font-size: 0.9rem;
        }

        .controls-list {
          background: rgba(255, 0, 255, 0.3);
        }

        .info-card {
          background: rgba(255, 0, 255, 0.3);
        }
      }
    `;
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'container';

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

    // Animation selector
    const animCard = document.createElement('div');
    animCard.className = 'info-card';
    animCard.style.gridColumn = 'span 2';
    const animLabel = document.createElement('div');
    animLabel.className = 'info-label';
    animLabel.textContent = 'Animation';
    const animSelect = document.createElement('select');
    animSelect.className = 'anim-select';
    animSelect.innerHTML = `
      <option value="IdleLoop">Idle Loop</option>
      <option value="DanceLoop">Dance Loop</option>
      <option value="WalkLoop">Walk Loop</option>
      <option value="RunAnime">Run</option>
      <option value="JumpStart">Jump Start</option>
      <option value="JumpLoop">Jump Loop</option>
      <option value="JumpLand">Jump Land</option>
      <option value="Wave">Wave</option>
      <option value="Victory">Victory</option>
      <option value="Backflip">Backflip</option>
    `;
    animSelect.addEventListener('change', (e) => {
      const vrmViewer = shadowRoot.querySelector('vrm-viewer') as any;
      if (vrmViewer?.playAnimation) {
        vrmViewer.playAnimation((e.target as HTMLSelectElement).value);
      }
    });
    animCard.appendChild(animLabel);
    animCard.appendChild(animSelect);
    infoGrid.appendChild(animCard);

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

    container.appendChild(mainLayout);
    container.appendChild(footer);

    shadowRoot.appendChild(container);
  }
}

// Register the custom element
if (!customElements.get('avatar-showcase')) {
  customElements.define('avatar-showcase', AvatarShowcase);
}
