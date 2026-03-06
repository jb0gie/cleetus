import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sparkles } from '@pmndrs/vanilla';

/**
 * VRMViewer Web Component - Enhanced Three.js
 *
 * Features:
 * - OrbitControls for smooth camera interaction
 * - VRM animation with Hyperfy-style retargeting
 * - Auto-blink expressions
 * - Sparkle effects
 */
export class VRMViewer extends HTMLElement implements HTMLElement {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private vrm: VRM | null = null;
  private isLoading = false;
  private orbitControls: OrbitControls | null = null;
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

  // Drei-vanilla effects
  private sparkles: any = null;

  // Animation state
  private animationMixer: THREE.AnimationMixer | null = null;
  private currentAnimation: THREE.AnimationAction | null = null;
  private animationClips: Map<string, THREE.AnimationClip> = new Map();
  private isAnimationLoaded = false;
  private animationSourceGLB: any = null;
  private sourceSkeleton: THREE.Skeleton | null = null;
  private targetSkeleton: THREE.Skeleton | null = null;

  // Bone name mapping: HYPERIGmk2 (with dots) -> Cleetus (no dots, suffix)
  private boneNameMap: Record<string, string> = {
    // Root
    'root': 'root',
    'hips': 'hips',
    // Spine
    'spine': 'spine',
    'chest': 'chest',
    'upperchest': 'upperChest',
    // Neck & Head
    'neck': 'neck',
    'head': 'head',
    // Eyes
    'eye.l': 'eyeL',
    'eye.r': 'eyeR',
    // Left arm (HYPERIGmk2: upper_arm.L -> Cleetus: upper_armL)
    'shoulder.l': 'shoulderL',
    'upper_arm.l': 'upper_armL',
    'lower_arm.l': 'lower_armL',
    'hand.l': 'handL',
    // Right arm
    'shoulder.r': 'shoulderR',
    'upper_arm.r': 'upper_armR',
    'lower_arm.r': 'lower_armR',
    'hand.r': 'handR',
    // Left leg
    'upper_leg.l': 'upper_legL',
    'lower_leg.l': 'lower_legL',
    'foot.l': 'footL',
    'toes.l': 'toesL',
    // Right leg
    'upper_leg.r': 'upper_legR',
    'lower_leg.r': 'lower_legR',
    'foot.r': 'footR',
    'toes.r': 'toesR',
    // Left fingers
    'thumb_proximal.l': 'thumb_proximalL',
    'thumb_intermediate.l': 'thumb_intermediateL',
    'thumb_distal.l': 'thumb_distalL',
    'index_proximal.l': 'index_proximalL',
    'index_intermediate.l': 'index_intermediateL',
    'index_distal.l': 'index_distalL',
    'middle_proximal.l': 'middle_proximalL',
    'middle_intermediate.l': 'middle_intermediateL',
    'middle_distal.l': 'middle_distalL',
    'ring_proximal.l': 'ring_proximalL',
    'ring_intermediate.l': 'ring_intermediateL',
    'ring_distal.l': 'ring_distalL',
    'little_proximal.l': 'little_proximalL',
    'little_intermediate.l': 'little_intermediateL',
    'little_distal.l': 'little_distalL',
    // Right fingers
    'thumb_proximal.r': 'thumb_proximalR',
    'thumb_intermediate.r': 'thumb_intermediateR',
    'thumb_distal.r': 'thumb_distalR',
    'index_proximal.r': 'index_proximalR',
    'index_intermediate.r': 'index_intermediateR',
    'index_distal.r': 'index_distalR',
    'middle_proximal.r': 'middle_proximalR',
    'middle_intermediate.r': 'middle_intermediateR',
    'middle_distal.r': 'middle_distalR',
    'ring_proximal.r': 'ring_proximalR',
    'ring_intermediate.r': 'ring_intermediateR',
    'ring_distal.r': 'ring_distalR',
    'little_proximal.r': 'little_proximalR',
    'little_intermediate.r': 'little_intermediateR',
    'little_distal.r': 'little_distalR',
  };

  static get observedAttributes() {
    return ['model-url', 'environment', 'animation'];
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
    if (this.sparkles) {
      this.sparkles.geometry.dispose();
      (this.sparkles.material as THREE.Material).dispose();
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === 'model-url') {
      this.loadModel();
    } else if (name === 'environment') {
      this.updateEnvironment(newValue || 'studio');
    } else if (name === 'animation') {
      this.playAnimation(newValue);
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

    // Scene setup - transparent to show CSS gradient behind
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = null;

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

    // Handle window resize with ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      this.onWindowResize();
    });
    this.resizeObserver.observe(container);

    // Initial resize
    this.onWindowResize();
  }

  private setupEnvironment() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Main directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
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

    // Add drei-vanilla effects
    this.setupDreiEffects();
  }

  private setupDreiEffects() {
    // Sparkles - magical particles around the avatar
    this.sparkles = new Sparkles({
      count: 100,
      scale: 3,
      color: new THREE.Color('#ffff00'),
      speed: 0.5,
      opacity: 0.8,
      size: 0.5,
    });
    this.sparkles.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.add(this.sparkles);
  }

  private updateEnvironment(preset: string) {
    const lightIntensity: Record<string, number> = {
      studio: 1.2,
      sunset: 1.0,
      dawn: 1.1,
      night: 0.6,
      forest: 0.95,
      city: 1.1,
    };

    if (this.directionalLight) {
      this.directionalLight.intensity = lightIntensity[preset] || 1.2;
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

      // Rotate to face camera
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

      // Get target skeleton for animations
      this.targetSkeleton = this.getSkeletonFromScene(vrm.scene);

      // Hide loading
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }

      // Reset camera
      if (this.orbitControls) {
        this.orbitControls.target.set(0, size.y * scale / 2, 0);
        this.orbitControls.update();
      }

      // Reset blink state
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

    // Load HYPERIGmk2 animations
    this.loadAnimations();
  }

  private async loadAnimations() {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync('/HYPERIGmk2.glb');

      if (gltf.animations && gltf.animations.length > 0) {
        this.animationSourceGLB = gltf;
        this.sourceSkeleton = this.getSkeletonFromScene(gltf.scene);

        // Store original animations (bone names already match)
        gltf.animations.forEach((clip) => {
          const cleanName = clip.name.replace(/^VRM\|/, '').replace(/@\d+$/, '');
          // Filter out scale tracks but keep original
          const filteredClip = this.filterScaleTracks(clip);
          this.animationClips.set(cleanName, filteredClip);
        });

        console.log(`Loaded and retargeted ${this.animationClips.size} animations`);
        this.isAnimationLoaded = true;

        // Auto-play idle
        this.playAnimation('IdleLoop');
      }
    } catch (error) {
      console.error('Failed to load animations:', error);
    }
  }

  // Filter scale and remap bone names
  private filterScaleTracks(sourceClip: THREE.AnimationClip): THREE.AnimationClip {
    const newTracks: THREE.KeyframeTrack[] = [];

    for (const track of sourceClip.tracks) {
      const parts = track.name.split('.');
      const sourceBoneName = parts[0].toLowerCase();
      const propertyName = parts[1];

      // Skip scale tracks
      if (propertyName === 'scale') continue;

      // Map bone name
      const targetBoneName = this.boneNameMap[sourceBoneName] || parts[0];

      // Clone track with remapped name
      if (track instanceof THREE.QuaternionKeyframeTrack) {
        newTracks.push(new THREE.QuaternionKeyframeTrack(
          `${targetBoneName}.quaternion`,
          track.times,
          track.values.slice()
        ));
      } else if (track instanceof THREE.VectorKeyframeTrack) {
        newTracks.push(new THREE.VectorKeyframeTrack(
          `${targetBoneName}.position`,
          track.times,
          track.values.slice()
        ));
      }
    }

    return new THREE.AnimationClip(sourceClip.name, sourceClip.duration, newTracks);
  }

  private getSkeletonFromScene(scene: THREE.Object3D): THREE.Skeleton | null {
    let skeleton: THREE.Skeleton | null = null;
    scene.traverse((obj: any) => {
      if (obj.isSkinnedMesh && obj.skeleton) {
        skeleton = obj.skeleton;
      }
    });
    return skeleton;
  }

  public playAnimation(name: string) {
    if (!this.vrm || !this.isAnimationLoaded) return;

    const clip = this.animationClips.get(name);
    if (!clip) {
      console.warn(`Animation not found: ${name}`);
      return;
    }

    // Stop current animation
    if (this.currentAnimation) {
      this.currentAnimation.stop();
      this.currentAnimation = null;
    }

    // Create mixer if needed
    if (!this.animationMixer) {
      this.animationMixer = new THREE.AnimationMixer(this.vrm.scene);
    }

    // Play animation
    this.currentAnimation = this.animationMixer.clipAction(clip);
    this.currentAnimation.reset().play();
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

    // Update animation mixer FIRST (before VRM update)
    if (this.animationMixer) {
      this.animationMixer.update(delta);
    }

    // Update VRM (after mixer, so expressions work but don't override animations)
    if (this.vrm) {
      this.vrm.update(delta);
      this.updateBlink(delta);
    }

    // Update drei-vanilla effects
    if (this.sparkles) {
      this.sparkles.update(now);
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

  public resetCamera() {
    if (this.orbitControls) {
      this.camera.position.set(0, 1.2, 2.5);
      this.orbitControls.target.set(0, 0.8, 0);
      this.orbitControls.update();
    }
  }

  public getAvailableAnimations(): string[] {
    return Array.from(this.animationClips.keys()).sort();
  }

  public setAnimation(name: string) {
    this.setAttribute('animation', name);
  }
}

// Register the custom element
if (!customElements.get('vrm-viewer')) {
  customElements.define('vrm-viewer', VRMViewer as any);
}
