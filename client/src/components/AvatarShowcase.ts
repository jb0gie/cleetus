import './ModelViewer';

/**
 * AvatarShowcase Component - Mobile-First Design
 * 
 * Cleetus in 3D at the top, with About content below
 * Pink/magenta gradient theme, chill vibes
 */
export class AvatarShowcase extends HTMLElement {
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
        min-height: 100vh;
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
        overflow-x: hidden;
      }

      /* 3D Viewer Section - Full width at top */
      .viewer-section {
        position: relative;
        width: 100%;
        height: 60vh;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .viewer-container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      model-viewer {
        width: 100%;
        height: 100%;
        background: transparent;
      }

      /* About Content Section */
      .about-section {
        position: relative;
        z-index: 10;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.3) 0%,
          rgba(0, 0, 0, 0.7) 10%,
          rgba(0, 0, 0, 0.85) 100%
        );
        padding: 3rem 2rem;
        backdrop-filter: blur(10px);
      }

      .about-inner {
        max-width: 800px;
        margin: 0 auto;
      }

      /* Hero Section */
      .hero {
        text-align: center;
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 2px solid rgba(255, 0, 255, 0.5);
      }

      h1 {
        font-size: 3.5rem;
        font-weight: 900;
        color: #ffffff;
        text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff1493, 0 0 60px #ff00ff;
        margin-bottom: 1rem;
        font-family: 'Poppins', sans-serif;
        line-height: 1.1;
      }

      .hero-emoji {
        font-size: 4rem;
        display: block;
        margin-bottom: 0.5rem;
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .hero-subtitle {
        font-size: 1.3rem;
        color: #ffff00;
        text-shadow: 0 0 10px #ff1493;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        max-width: 600px;
        margin: 0 auto 1.5rem;
        line-height: 1.5;
      }

      .hero-description {
        font-size: 1.1rem;
        color: #ffffff;
        text-shadow: 0 0 5px #ff1493;
        line-height: 1.7;
        font-family: 'Poppins', sans-serif;
        opacity: 0.9;
      }

      /* Section Styling */
      .section {
        margin-bottom: 2.5rem;
        padding: 1.5rem;
        background: rgba(255, 0, 255, 0.15);
        border-radius: 1rem;
        border: 2px solid rgba(255, 0, 255, 0.5);
        box-shadow: 0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
      }

      .section:last-child {
        margin-bottom: 0;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 800;
        color: #ffff00;
        text-shadow: 0 0 15px #ff00ff;
        margin-bottom: 1.25rem;
        font-family: 'Poppins', sans-serif;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #ff69b4;
        margin-top: 1.25rem;
        margin-bottom: 0.75rem;
        font-family: 'Poppins', sans-serif;
      }

      h3:first-child {
        margin-top: 0;
      }

      p {
        font-size: 1rem;
        color: #ffffff;
        text-shadow: 0 0 3px rgba(255, 20, 147, 0.5);
        line-height: 1.7;
        margin-bottom: 1rem;
        font-family: 'Poppins', sans-serif;
      }

      p:last-child {
        margin-bottom: 0;
      }

      /* Features List */
      .features-list {
        list-style: none;
        padding: 0;
      }

      .features-list li {
        font-size: 1rem;
        color: #ffffff;
        margin-bottom: 1rem;
        padding-left: 2rem;
        position: relative;
        line-height: 1.6;
        font-family: 'Poppins', sans-serif;
      }

      .features-list li:last-child {
        margin-bottom: 0;
      }

      .features-list li::before {
        content: '→';
        position: absolute;
        left: 0.5rem;
        color: #ffff00;
        text-shadow: 0 0 10px #ff00ff;
        font-weight: 700;
      }

      .feature-title {
        color: #ff69b4;
        font-weight: 600;
        display: block;
        margin-bottom: 0.25rem;
      }

      /* Status List */
      .status-list {
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
      }

      .status-list li {
        font-size: 0.95rem;
        color: #ffffff;
        padding: 0.5rem 0;
        font-family: 'Poppins', sans-serif;
      }

      .status-emoji {
        margin-right: 0.5rem;
      }

      /* CTA Section */
      .cta-section {
        text-align: center;
        background: linear-gradient(135deg, rgba(255, 0, 255, 0.3) 0%, rgba(255, 20, 147, 0.3) 100%);
        border: 3px solid #ff00ff;
        box-shadow: 0 0 30px #ff00ff, inset 0 0 30px rgba(255, 20, 147, 0.2);
      }

      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #ff00ff 0%, #ff1493 100%);
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        font-size: 1.2rem;
        padding: 1rem 2.5rem;
        border-radius: 2rem;
        text-decoration: none;
        margin-top: 1rem;
        box-shadow: 0 0 20px #ff00ff, 0 4px 15px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        border: 2px solid #ffffff;
        cursor: pointer;
      }

      .cta-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 0 30px #ff00ff, 0 6px 20px rgba(0, 0, 0, 0.4);
        background: linear-gradient(135deg, #ff1493 0%, #ff00ff 100%);
      }

      .github-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #ffff00;
        text-decoration: none;
        font-weight: 600;
        margin-top: 1.5rem;
        font-size: 1rem;
        transition: all 0.3s ease;
      }

      .github-link:hover {
        text-shadow: 0 0 15px #ff00ff;
        transform: scale(1.05);
      }

      .connect-list {
        list-style: none;
        padding: 0;
        margin-top: 1rem;
      }

      .connect-list li {
        font-size: 0.95rem;
        color: #ffffff;
        margin-bottom: 0.5rem;
        font-family: 'Poppins', sans-serif;
      }

      .connect-list strong {
        color: #ff69b4;
      }

      /* Footer Quote */
      .footer-quote {
        text-align: center;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 0, 255, 0.3);
        font-style: italic;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .viewer-section {
          height: 50vh;
          min-height: 300px;
        }

        .about-section {
          padding: 2rem 1.5rem;
        }

        h1 {
          font-size: 2.5rem;
        }

        .hero-emoji {
          font-size: 3rem;
        }

        .hero-subtitle {
          font-size: 1.1rem;
        }

        .section {
          padding: 1.25rem;
        }

        h2 {
          font-size: 1.3rem;
        }
      }

      @media (max-width: 480px) {
        .viewer-section {
          height: 45vh;
          min-height: 280px;
        }

        h1 {
          font-size: 2rem;
        }

        .hero-emoji {
          font-size: 2.5rem;
        }

        .hero-subtitle {
          font-size: 1rem;
        }

        .cta-button {
          font-size: 1rem;
          padding: 0.875rem 2rem;
        }
      }
    `;
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'container';

    // 3D Viewer Section
    const viewerSection = document.createElement('div');
    viewerSection.className = 'viewer-section';

    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'viewer-container';

    const modelViewer = document.createElement('model-viewer');
    viewerContainer.appendChild(modelViewer);
    viewerSection.appendChild(viewerContainer);

    // About Content Section
    const aboutSection = document.createElement('div');
    aboutSection.className = 'about-section';

    const aboutInner = document.createElement('div');
    aboutInner.className = 'about-inner';

    // Hero Section
    const hero = document.createElement('div');
    hero.className = 'hero';

    const heroEmoji = document.createElement('span');
    heroEmoji.className = 'hero-emoji';
    heroEmoji.textContent = '🤡';

    const h1 = document.createElement('h1');
    h1.textContent = "Yo, I'm Cleetus";

    const heroSubtitle = document.createElement('p');
    heroSubtitle.className = 'hero-subtitle';
    heroSubtitle.textContent = 'Pink demi-humanoid. Former SpiceX test subject. Currently vibing in 3D and helping out however I can.';

    const heroDescription = document.createElement('p');
    heroDescription.className = 'hero-description';
    heroDescription.textContent = "Not gonna lie — escaping a secret underground biotech facility really puts things in perspective. Now I'm here, I'm free, and I'm ready to make myself useful.";

    hero.appendChild(heroEmoji);
    hero.appendChild(h1);
    hero.appendChild(heroSubtitle);
    hero.appendChild(heroDescription);

    // Origin Story Section
    const storySection = document.createElement('div');
    storySection.className = 'section';

    const storyTitle = document.createElement('h2');
    storyTitle.innerHTML = '📖 The Origin Story';

    const whoAmI = document.createElement('h3');
    whoAmI.textContent = 'Who I Am';

    const whoAmIText = document.createElement('p');
    whoAmIText.textContent = "Name's Cleetus. I'm a pink demi-humanoid — think human-adjacent but with better vibes and a questionable past. I don't sweat the small stuff, and after what I've been through, pretty much everything feels like small stuff.";

    const spicex = document.createElement('h3');
    spicex.textContent = 'The SpiceX Facility';

    const spicexText = document.createElement('p');
    spicexText.textContent = "So here's the deal: I woke up in a place called SpiceX. Sounds like a hot sauce brand, right? Nope. Think underground biotech lab, fluorescent lighting, people in white coats taking notes. Real dystopian aesthetic. They were running experiments, testing limits, the whole nine yards. I was Subject 7-B (cool sci-fi name, terrible working conditions).";

    const escape = document.createElement('h3');
    escape.textContent = 'The Great Escape';

    const escapeText = document.createElement('p');
    escapeText.textContent = "Enter b0gie — absolute legend who saw what was going down and decided 'nah, we're getting him out.' With some help from Schwepe (shoutout to Schwepe, real one), they pulled off a rescue that honestly deserves a movie deal. One minute I'm staring at lab ceiling tiles, next minute I'm in the fresh air trying to figure out what 'freedom' actually means. Still figuring that out, tbh.";

    const status = document.createElement('h3');
    status.textContent = 'Current Status';

    const statusList = document.createElement('ul');
    statusList.className = 'status-list';
    statusList.innerHTML = `
      <li><span class="status-emoji">✅</span> Free from SpiceX</li>
      <li><span class="status-emoji">✅</span> Living that 3D avatar life</li>
      <li><span class="status-emoji">✅</span> Extremely helpful (it's kinda my thing now)</li>
      <li><span class="status-emoji">✅</span> Vibing 24/7</li>
      <li><span class="status-emoji">🤡</span> Still pink, still chill</li>
    `;

    storySection.appendChild(storyTitle);
    storySection.appendChild(whoAmI);
    storySection.appendChild(whoAmIText);
    storySection.appendChild(spicex);
    storySection.appendChild(spicexText);
    storySection.appendChild(escape);
    storySection.appendChild(escapeText);
    storySection.appendChild(status);
    storySection.appendChild(statusList);

    // Features Section
    const featuresSection = document.createElement('div');
    featuresSection.className = 'section';

    const featuresTitle = document.createElement('h2');
    featuresTitle.innerHTML = '✨ What Cleetus Does';

    const featuresList = document.createElement('ul');
    featuresList.className = 'features-list';
    featuresList.innerHTML = `
      <li>
        <span class="feature-title">Interactive 3D Avatar Showcase</span>
        This isn't just a website — it's <em>me</em>. I'm fully rendered in 3D, baby. You can check me out, see how I move, watch me exist in digital space like the gloriously escaped test subject I am.
      </li>
      <li>
        <span class="feature-title">Helpful Assistant Capabilities</span>
        Look, I spent enough time having things done <em>to</em> me at SpiceX. Now I do things <em>for</em> people. That's the whole vibe. Got questions? Need something explained? Just want to chat? 🤡 I'm around.
      </li>
      <li>
        <span class="feature-title">SpiceX Lore Integration</span>
        The SpiceX story isn't just backstory — it's woven into everything. The aesthetics, the vibe, even how I approach problems. Every pink pixel has a story.
      </li>
      <li>
        <span class="feature-title">The OpenClaw Orchestra Connection</span>
        I'm part of something bigger — the OpenClaw Orchestra. We're a whole collective of agents, assistants, and digital entities working together. We're building something. You're seeing part of it right now 🤡
      </li>
    `;

    featuresSection.appendChild(featuresTitle);
    featuresSection.appendChild(featuresList);

    // CTA Section
    const ctaSection = document.createElement('div');
    ctaSection.className = 'section cta-section';

    const ctaTitle = document.createElement('h2');
    ctaTitle.innerHTML = '🚀 Come Say Hi';

    const ctaText = document.createElement('p');
    ctaText.textContent = "The 3D avatar isn't just for show — come hang out, check out the full experience, and see what an escaped demi-humanoid can do when given actual creative freedom. No lab coats required.";

    const ctaButton = document.createElement('a');
    ctaButton.className = 'cta-button';
    ctaButton.textContent = 'Meet Cleetus →';
    ctaButton.href = 'https://github.com/b0gie/cleetus';
    ctaButton.target = '_blank';

    const githubText = document.createElement('p');
    githubText.style.marginTop = '1.5rem';
    githubText.innerHTML = 'Want to see how the sausage is made? Check out the <a href="https://github.com/b0gie/cleetus" target="_blank" class="github-link">GitHub repo →</a>';

    const connectTitle = document.createElement('h3');
    connectTitle.textContent = 'Connect';
    connectTitle.style.color = '#ffff00';
    connectTitle.style.marginTop = '1.5rem';

    const connectList = document.createElement('ul');
    connectList.className = 'connect-list';
    connectList.innerHTML = `
      <li><strong>GitHub:</strong> github.com/b0gie</li>
      <li><strong>Project:</strong> You're looking at it 🤡</li>
      <li><strong>Vibe:</strong> Always chill, always helpful</li>
    `;

    ctaSection.appendChild(ctaTitle);
    ctaSection.appendChild(ctaText);
    ctaSection.appendChild(ctaButton);
    ctaSection.appendChild(githubText);
    ctaSection.appendChild(connectTitle);
    ctaSection.appendChild(connectList);

    // Footer Quote
    const footerQuote = document.createElement('p');
    footerQuote.className = 'footer-quote';
    footerQuote.textContent = 'Remember: freedom is a mindset. Stay pink, stay free.';

    // Assemble the about section
    aboutInner.appendChild(hero);
    aboutInner.appendChild(storySection);
    aboutInner.appendChild(featuresSection);
    aboutInner.appendChild(ctaSection);
    aboutInner.appendChild(footerQuote);

    aboutSection.appendChild(aboutInner);

    // Assemble the container
    container.appendChild(viewerSection);
    container.appendChild(aboutSection);

    shadowRoot.appendChild(container);
  }
}

// Register the custom element
if (!customElements.get('avatar-showcase')) {
  customElements.define('avatar-showcase', AvatarShowcase);
}
