import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * VRMViewer Web Component - Enhanced Three.js
 *
 * Features:
 * - OrbitControls for smooth camera interaction
 * - Soft shadows for realistic grounding
 * - Environment lighting
 * - Automatic avatar positioning
 * - VRM animation and rendering
 */
export class VRMViewer extends HTMLElement implements HTMLElement {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private vrm: VRM | null = null;
  private isLoading = false;
  private orbitControls: OrbitControls | null = null;
  private shadowPlane: THREE.Mesh | null = null;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private animationId: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  // Auto-blink state
  private blinkState = {
    isBlinking: false,
    blinkProgress: 0,
    blinkDuration: 0.15,
    blinkTimer: 0,
    nextBlinkTime: this.randomBlinkTime(),
  };

  static get observedAttributes() {
    return ['model-url', 'environment', 'shadows'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.initThreeJS();
    this.loadModel();
    this.animationLoop();
  }

  disconnectedCallback() {
    this.lastFrameTime = 0;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.orbitControls) {
      this.orbitControls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === 'model-url') {
      this.loadModel();
    } else if (name === 'environment') {
      this.updateEnvironment(newValue || 'studio');
    } else if (name === 'shadows') {
      this.updateShadows(newValue !== 'false');
    }
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
      #container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }
      #canvas-container {
        flex: 1;
        width: 100%;
        position: relative;
        overflow: hidden;
      }
      #loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 10;
        font-family: 'Poppins', sans-serif;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #fbcfe8;
        border-top-color: #ec4899;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 1rem;
      }
      .loading-text {
        color: #be185d;
        font-weight: 600;
        font-size: 1.125rem;
      }
      .error-text {
        color: #dc2626;
        font-weight: 600;
        font-size: 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.id = 'container';

    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'canvas-container';

    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.innerHTML = `
      <div class="spinner"></div>
      <div class="loading-text">Loading Cleetus...</div>
    `;

    canvasContainer.appendChild(loading);
    container.appendChild(canvasContainer);
    shadowRoot.appendChild(container);
  }

  private initThreeJS() {
    const container = this.shadowRoot?.getElementById('canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfdf6e3);
    this.scene.fog = new THREE.Fog(0xfdf6e3, 5, 15);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 2.5);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 1;
    this.orbitControls.maxDistance = 5;
    this.orbitControls.target.set(0, 0.8, 0);
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;

    // Environment and lighting
    this.setupEnvironment();

    // Contact shadows
    this.setupContactShadows();

    // Handle window resize with ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      this.onWindowResize();
    });
    this.resizeObserver.observe(container);

    // Initial resize
    this.onWindowResize();
  }

  private setupEnvironment() {
    const envPreset = this.getAttribute('environment') || 'studio';

    // Environment presets - HOT PINK theme
    const presets: Record<string, { color: number; fog: number; lightIntensity: number }> = {
      studio: { color: 0xff1493, fog: 0xff1493, lightIntensity: 1.2 },
      hotpink: { color: 0xff00ff, fog: 0xff00ff, lightIntensity: 1.3 },
      sunset: { color: 0xff1493, fog: 0xff69b4, lightIntensity: 1.0 },
      dawn: { color: 0xff69b4, fog: 0xffc0cb, lightIntensity: 1.1 },
      night: { color: 0x8b008b, fog: 0x4b0082, lightIntensity: 0.8 },
      cyber: { color: 0xff00ff, fog: 0x00ffff, lightIntensity: 1.4 },
    };

    const preset = presets[envPreset] || presets.studio;

    // Apply preset
    this.scene.background = new THREE.Color(preset.color);
    this.scene.fog = new THREE.Fog(preset.fog, 5, 15);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Main directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, preset.lightIntensity);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 20;
    this.directionalLight.shadow.bias = -0.001;
    this.scene.add(this.directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 5, -8);
    this.scene.add(rimLight);
  }

  private updateEnvironment(preset: string) {
    const presets: Record<string, { color: number; fog: number; lightIntensity: number }> = {
      studio: { color: 0xfdf6e3, fog: 0xfdf6e3, lightIntensity: 1.0 },
      sunset: { color: 0xffe4c4, fog: 0xffcc99, lightIntensity: 0.8 },
      dawn: { color: 0xe6e6fa, fog: 0xd8bfd8, lightIntensity: 0.9 },
      night: { color: 0x1a1a2e, fog: 0x16213e, lightIntensity: 0.6 },
      forest: { color: 0xe8f5e9, fog: 0xc8e6c9, lightIntensity: 0.95 },
      city: { color: 0xe3f2fd, fog: 0xbbdefb, lightIntensity: 1.1 },
    };

    const config = presets[preset] || presets.studio;

    this.scene.background = new THREE.Color(config.color);
    this.scene.fog = new THREE.Fog(config.fog, 5, 15);

    if (this.directionalLight) {
      this.directionalLight.intensity = config.lightIntensity;
    }
  }

  private setupContactShadows() {
    const showShadows = this.getAttribute('shadows') !== 'false';
    if (!showShadows) return;

    // Create shadow plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.ShadowMaterial({
      opacity: 0.3,
      color: 0x000000,
    });

    this.shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = 0;
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.shadowPlane);

    // Additional ground plane for visual grounding
    const groundGeometry = new THREE.CircleGeometry(4, 64);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0xff1493,
      transparent: true,
      opacity: 0.5,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    this.scene.add(ground);
  }

  private updateShadows(enabled: boolean) {
    if (enabled && !this.shadowPlane) {
      this.setupContactShadows();
    } else if (!enabled && this.shadowPlane) {
      this.scene.remove(this.shadowPlane);
      this.shadowPlane = null;
    }
  }

  private onWindowResize() {
    const container = this.shadowRoot?.getElementById('canvas-container');
    if (!container || !this.renderer || !this.camera) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private async loadModel() {
    let modelUrl = this.getAttribute('model-url');

    // Default to local Cleetus.vrm if no URL provided
    if (!modelUrl) {
      modelUrl = '/Cleetus.vrm';
    }

    this.isLoading = true;
    const loadingDiv = this.shadowRoot?.getElementById('loading');
    if (loadingDiv) {
      loadingDiv.style.display = 'block';
      loadingDiv.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">Loading Cleetus...</div>
      `;
    }

    try {
      const loader = new GLTFLoader();
      loader.register((parser: any) => new VRMLoaderPlugin(parser));

      const gltf = await loader.loadAsync(modelUrl);
      const vrm = gltf.userData.vrm as VRM;

      // Remove old VRM if exists
      if (this.vrm) {
        this.scene.remove(this.vrm.scene);
        this.vrm = null;
        this.blinkState.isBlinking = false;
        this.blinkState.blinkProgress = 0;
        this.blinkState.blinkTimer = 0;
        this.blinkState.nextBlinkTime = this.randomBlinkTime();
      }

      this.vrm = vrm;

      // Center and scale the avatar
      const bbox = new THREE.Box3().setFromObject(vrm.scene);
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 1.6;
      const scale = targetSize / maxDim;
      vrm.scene.scale.multiplyScalar(scale);

      const center = bbox.getCenter(new THREE.Vector3());
      vrm.scene.position.sub(center.multiplyScalar(scale));
      vrm.scene.position.y += size.y * scale / 2;

      // Rotate to face camera (VRM models typically face +Z, rotate 180 to face camera at +Z)
      vrm.scene.rotation.y = Math.PI;

      // Enable shadows
      vrm.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add to scene
      this.scene.add(vrm.scene);

      // Hide loading
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }

      // Reset camera to view the model
      if (this.orbitControls) {
        this.orbitControls.target.set(0, size.y * scale / 2, 0);
        this.orbitControls.update();
      }

      // Reset blink state for new model
      this.blinkState.isBlinking = false;
      this.blinkState.blinkProgress = 0;
      this.blinkState.blinkTimer = 0;
      this.blinkState.nextBlinkTime = this.randomBlinkTime();

    } catch (error) {
      console.error('Failed to load VRM model:', error);
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div class="error-text">Failed to load avatar</div>
          <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
            ${modelUrl}
          </div>
        `;
      }
    }

    this.isLoading = false;
  }

  private lastFrameTime = 0;

  private animationLoop = (): void => {
    this.animationId = requestAnimationFrame(this.animationLoop);

    const now = performance.now() / 1000;
    const delta = this.lastFrameTime ? now - this.lastFrameTime : 0.016;
    this.lastFrameTime = now;

    // Update orbit controls with damping
    if (this.orbitControls) {
      this.orbitControls.update();
    }

    // Update VRM animation
    if (this.vrm) {
      this.vrm.update(delta);
      this.updateBlink(delta);
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  private randomBlinkTime(): number {
    return Math.random() * 3 + 2;
  }

  private updateBlink(delta: number): void {
    if (!this.vrm?.expressionManager) return;

    const em = this.vrm.expressionManager;
    const state = this.blinkState;

    state.blinkTimer += delta;

    if (state.isBlinking) {
      state.blinkProgress += delta / state.blinkDuration;

      if (state.blinkProgress >= 1) {
        state.isBlinking = false;
        state.blinkProgress = 0;
        state.blinkTimer = 0;
        state.nextBlinkTime = this.randomBlinkTime();
      }
    } else if (state.blinkTimer >= state.nextBlinkTime) {
      state.isBlinking = true;
      state.blinkProgress = 0;
    }

    const value = state.isBlinking
      ? Math.sin(state.blinkProgress * Math.PI)
      : 0;

    em.setValue('blink', value);
  }

  // Public API for external control
  public setEnvironment(preset: 'studio' | 'sunset' | 'dawn' | 'night' | 'forest' | 'city') {
    this.setAttribute('environment', preset);
  }

  public setShadows(enabled: boolean) {
    this.setAttribute('shadows', String(enabled));
  }

  public resetCamera() {
    if (this.orbitControls) {
      this.camera.position.set(0, 1.2, 2.5);
      this.orbitControls.target.set(0, 0.8, 0);
      this.orbitControls.update();
    }
  }
}

// Register the custom element
if (!customElements.get('vrm-viewer')) {
  customElements.define('vrm-viewer', VRMViewer as any);
}
