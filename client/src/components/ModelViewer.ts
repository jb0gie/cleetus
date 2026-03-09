import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sparkles, CameraShake } from '@pmndrs/vanilla';

/**
 * ModelViewer Web Component - Enhanced Three.js
 *
 * Features:
 * - OrbitControls for smooth camera interaction
 * - GLB animation support
 * - Sparkle effects
 */
export class ModelViewer extends HTMLElement implements HTMLElement {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private model: THREE.Group | null = null;
  private isLoading = false;
  private orbitControls: OrbitControls | null = null;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private animationId: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  // Drei-vanilla effects
  private sparkles: any = null;
  private cameraShake: CameraShake | null = null;

  // Head bone for camera tracking
  private headBone: THREE.Object3D | null = null;

  // Morph targets for facial animation
  private morphMeshes: THREE.Mesh[] = [];
  private morphTime = 0;

  // Animation state
  private animationMixer: THREE.AnimationMixer | null = null;
  private currentAnimation: THREE.AnimationAction | null = null;
  private animationClips: Map<string, THREE.AnimationClip> = new Map();
  private isAnimationLoaded = false;

  // Animation cycling state
  private animationCycle = {
    isPlayingIntro: false,
    idleClips: ['idleZero', 'idleTwo'],
    currentIdleIndex: 0,
    idleSwitchTimer: 0,
    idleSwitchInterval: 5, // Switch idle every 5 seconds
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
    if (this.animationMixer) {
      this.animationMixer.removeEventListener('finished', this.onAnimationFinished);
      this.animationMixer.stopAllAction();
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
        pointer-events: auto;
      }

      #canvas-container canvas {
        pointer-events: auto;
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

    // Camera setup - shifted right to center Cleetus in viewport
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    //this.camera.position.set(0, 1.2, 3.3); // orginal position incase we want to revert back to it, but the new position is better for framing the model in the viewport
    this.camera.position.set(-0.5, 0.8, 3.3); // Start slightly left to center the model better (sweet spot for 16:9 needs some work for mobile portrait)

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

    // OrbitControls - enable full 360-degree orbit (only makes the camera pan)
    // this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.orbitControls.enableDamping = true;
    // this.orbitControls.dampingFactor = 0.05;
    // this.orbitControls.minDistance = 1;
    // this.orbitControls.maxDistance = 5;
    // this.orbitControls.target.set(0, 1, 0);
    // // Enable all rotation axes
    // this.orbitControls.enableRotate = true;
    // this.orbitControls.rotateSpeed = 1.0;
    // // Explicitly allow full 360-degree horizontal rotation
    // this.orbitControls.minAzimuthAngle = -Infinity;
    // this.orbitControls.maxAzimuthAngle = Infinity;
    // // No vertical angle constraints for full orbit
    // this.orbitControls.minPolarAngle = 0;
    // this.orbitControls.maxPolarAngle = Math.PI;

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

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0xff00ff, 0xff1493);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    // Add drei-vanilla effects
    this.setupDreiEffects();
  }

  private setupDreiEffects() {
    // Sparkles - magical particles around the avatar
    this.sparkles = new Sparkles({
      count: 1000,
      scale: 3,
      color: new THREE.Color('#ffff00'),
      speed: 0.5,
      opacity: 0.8,
      size: 0.69,
    });
    this.sparkles.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.add(this.sparkles);

    // Camera shake for dynamic feel (subtle)
    this.cameraShake = new CameraShake(this.camera);
    this.cameraShake.maxYaw = 0.03;
    this.cameraShake.maxPitch = 0.03;
    this.cameraShake.maxRoll = 0.02;
    this.cameraShake.yawFrequency = 0.2;
    this.cameraShake.pitchFrequency = 0.2;
    this.cameraShake.rollFrequency = 0.2;
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

    // Only update aspect ratio and renderer size
    // DO NOT reset camera position - let OrbitControls manage that
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // Adjust FOV based on device type without resetting camera position
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPortrait = width < height;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    if (this.model) {
      if (isMobile || isTouchDevice || (isPortrait && width < 768)) {
        // Mobile/tablet portrait view
        this.camera.fov = 70;
      } else if (isPortrait) {
        // Desktop portrait (tall window)
        this.camera.fov = 60;
      } else {
        // Desktop landscape
        this.camera.fov = 50;
      }
      this.camera.updateProjectionMatrix();
    }
  }

  private async loadModel() {
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
      // Use relative path for GitHub Pages compatibility
      const modelPath = import.meta.env.BASE_URL ? `${import.meta.env.BASE_URL}cleetus.glb` : 'cleetus.glb';
      const gltf = await loader.loadAsync(modelPath);

      // Store animations from the GLB
      if (gltf.animations && gltf.animations.length > 0) {
        for (const clip of gltf.animations) {
          this.animationClips.set(clip.name, clip);
        }
        this.isAnimationLoaded = true;
      }

      // Remove old model if exists
      if (this.model) {
        this.scene.remove(this.model);
        this.model = null;
        this.headBone = null;
        this.morphMeshes = [];
      }

      this.model = gltf.scene;

      // Center and scale the avatar
      const bbox = new THREE.Box3().setFromObject(this.model);
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 1.6;
      const scale = targetSize / maxDim;
      this.model.scale.multiplyScalar(scale);

      const center = bbox.getCenter(new THREE.Vector3());
      // Center the model at origin
      this.model.position.x = -center.x * scale;
      this.model.position.y = -center.y * scale + size.y * scale / 2;
      this.model.position.z = -center.z * scale;

      // Model already faces camera in the GLB, no rotation needed

      // Enable shadows, find head bone, and collect morph targets
      this.model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Collect meshes with morph targets
          if (child.morphTargetDictionary && Object.keys(child.morphTargetDictionary).length > 0) {
            this.morphMeshes.push(child);
          }
        }
        // Look for head bone by name
        if (child.isBone && /head|Head/i.test(child.name)) {
          this.headBone = child;
        }
      });

      // Add to scene
      this.scene.add(this.model);

      // Create animation mixer
      this.animationMixer = new THREE.AnimationMixer(this.model);
      this.animationMixer.addEventListener('finished', this.onAnimationFinished);

      // Start with introWalk (play once, then transition to idle)
      if (this.animationClips.has('introWalk')) {
        console.log('Starting introWalk animation');
        this.playAnimation('introWalk', false);
        this.animationCycle.isPlayingIntro = true;
      } else {
        console.log('No introWalk animation found, available:', this.getAvailableAnimations());
      }

      // Hide loading
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }

      // Reset camera target to maintain proper orbit center
      // Keep the original target (1, 1.5, 0) for side-view orbit
      if (this.orbitControls) {
        this.orbitControls.target.set(1, 1.5, 0);
        this.orbitControls.update();
      }

    } catch (error) {
      console.error('Failed to load model:', error);
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div class="error-text">Failed to load avatar</div>
          <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
            /cleetus.glb
          </div>
        `;
      }
    }

    this.isLoading = false;
  }

  private onAnimationFinished = (e: any) => {
    if (!this.animationMixer) return;

    const action = e.action as THREE.AnimationAction;
    const clipName = action.getClip().name;

    if (clipName === 'introWalk' && this.animationCycle.isPlayingIntro) {
      // Transition to idle cycle after introWalk
      this.animationCycle.isPlayingIntro = false;
      this.animationCycle.idleSwitchTimer = 0;
      this.playNextIdleAnimation();
    } else if (this.animationCycle.idleClips.includes(clipName)) {
      // Cycle between idle animations
      this.playNextIdleAnimation();
    }
  };

  private playNextIdleAnimation() {
    const idleName = this.animationCycle.idleClips[this.animationCycle.currentIdleIndex];
    this.playAnimation(idleName, true);
    this.animationCycle.currentIdleIndex = (this.animationCycle.currentIdleIndex + 1) % this.animationCycle.idleClips.length;
  }

  public playAnimation(name: string, loop: boolean = true, blendDuration: number = 0.3) {
    if (!this.model || !this.isAnimationLoaded) return;

    const clip = this.animationClips.get(name);
    if (!clip) {
      console.warn(`Animation not found: ${name}`);
      return;
    }

    const newAction = this.animationMixer!.clipAction(clip);
    newAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    newAction.clampWhenFinished = !loop;

    if (this.currentAnimation) {
      // Cross fade from current to new
      this.currentAnimation.crossFadeTo(newAction, blendDuration, true);
    }

    newAction.reset().play();
    this.currentAnimation = newAction;
  }


  private lastFrameTime = 0;

  // Natural eye movement state
  private lookTarget = { x: 0, y: 0 };
  private lookCurrent = { x: 0, y: 0 };
  private nextLookChangeTime = 0;

  private getNaturalLookState(time: number): { leftAmount: number; rightAmount: number; upAmount: number; downAmount: number } {
    // Change look target every 3-8 seconds (randomized)
    if (time > this.nextLookChangeTime) {
      // 40% chance to look straight ahead, 30% left, 30% right
      const rand = Math.random();
      if (rand < 0.4) {
        this.lookTarget.x = 0;
      } else if (rand < 0.7) {
        this.lookTarget.x = -1;
      } else {
        this.lookTarget.x = 1;
      }

      // Small vertical variation
      this.lookTarget.y = (Math.random() - 0.5) * 0.5;

      // Set next change time (3-8 seconds)
      this.nextLookChangeTime = time + 3 + Math.random() * 5;
    }

    // Smoothly interpolate current position to target
    const smoothSpeed = 0.08;
    this.lookCurrent.x += (this.lookTarget.x - this.lookCurrent.x) * smoothSpeed;
    this.lookCurrent.y += (this.lookTarget.y - this.lookCurrent.y) * smoothSpeed;

    // Add micro-saccades (tiny rapid eye movements)
    const microSaccade = Math.sin(time * 15) * 0.02;

    const lookX = this.lookCurrent.x + microSaccade;
    const lookY = this.lookCurrent.y + microSaccade * 0.5;

    return {
      leftAmount: Math.max(0, -lookX),
      rightAmount: Math.max(0, lookX),
      upAmount: Math.max(0, lookY),
      downAmount: Math.max(0, -lookY),
    };
  }

  private animateMorphTargets(delta: number, now: number): void {
    if (this.morphMeshes.length === 0) return;

    this.morphTime += delta;

    // More pronounced breathing animation
    const breath = Math.sin(this.morphTime * 0.8) * 0.5 + 0.5; // 0 to 1
    const microMove = Math.sin(this.morphTime * 2.5) * 0.3;

    for (const mesh of this.morphMeshes) {
      if (!mesh.morphTargetInfluences) continue;

      const dict = mesh.morphTargetDictionary;
      if (!dict) continue;

      // Animate common VRM facial morphs
      for (const [name, index] of Object.entries(dict)) {
        const lowerName = name.toLowerCase();

        // VRM Standard expressions (blend shape proxy names)
        // Happy, Angry, Surprised, Relaxed, etc.
        if (lowerName === 'happy') {
          mesh.morphTargetInfluences[index] = 0.3 + microMove * 0.2;
        } else if (lowerName === 'relaxed') {
          mesh.morphTargetInfluences[index] = 0.4 + breath * 0.2;
        } else if (lowerName === 'surprised') {
          mesh.morphTargetInfluences[index] = Math.sin(this.morphTime * 0.3) * 0.2;
        }

        // Mouth movements
        if (lowerName.includes('mouth') || lowerName.includes('jaw')) {
          if (lowerName.includes('open')) {
            mesh.morphTargetInfluences[index] = breath * 0.3;
          } else if (lowerName.includes('smile') || lowerName === 'a') {
            mesh.morphTargetInfluences[index] = 0.2 + microMove * 0.2;
          } else if (lowerName === 'i') {
            // Talking/eyebrow raise
            mesh.morphTargetInfluences[index] = Math.sin(this.morphTime * 3) * 0.3;
          } else if (lowerName === 'o') {
            mesh.morphTargetInfluences[index] = Math.sin(this.morphTime * 1.5) * 0.2;
          } else if (lowerName === 'u') {
            mesh.morphTargetInfluences[index] = Math.sin(this.morphTime * 1.2) * 0.2;
          }
        }

        // Eye/eyebrow movements
        if (lowerName.includes('eye') || lowerName.includes('brow')) {
          if (lowerName.includes('blink')) {
            // Occasional blink
            const blinkPhase = (this.morphTime % 3);
            if (blinkPhase < 0.15) {
              mesh.morphTargetInfluences[index] = Math.sin(blinkPhase / 0.15 * Math.PI);
            } else {
              mesh.morphTargetInfluences[index] = 0;
            }
          } else if (lowerName.includes('brow') || lowerName === 'e') {
            // Eyebrow movement
            mesh.morphTargetInfluences[index] = Math.sin(this.morphTime * 2) * 0.3;
          }
        }

        // Cheek movement
        if (lowerName.includes('cheek')) {
          mesh.morphTargetInfluences[index] = breath * 0.2;
        }

        // Eye look direction using morph targets - natural random movement
        const lookState = this.getNaturalLookState(this.morphTime);

        if (lowerName.includes('look')) {
          if (lowerName.includes('out')) {
            // LookOut - positive value looks outward
            if (lowerName.includes('left')) {
              mesh.morphTargetInfluences[index] = lookState.leftAmount * 0.6;
            } else if (lowerName.includes('right')) {
              mesh.morphTargetInfluences[index] = lookState.rightAmount * 0.6;
            }
          } else if (lowerName.includes('in')) {
            // LookIn - positive value looks inward
            if (lowerName.includes('left')) {
              mesh.morphTargetInfluences[index] = lookState.rightAmount * 0.3;
            } else if (lowerName.includes('right')) {
              mesh.morphTargetInfluences[index] = lookState.leftAmount * 0.3;
            }
          }
        }

        // Subtle up/down movement
        if (lowerName.includes('lookup')) {
          mesh.morphTargetInfluences[index] = lookState.upAmount * 0.2;
        } else if (lowerName.includes('lookdown')) {
          mesh.morphTargetInfluences[index] = lookState.downAmount * 0.2;
        }
      }
    }
  }

  private animationLoop = (): void => {
    this.animationId = requestAnimationFrame(this.animationLoop);

    const now = performance.now() / 1000;
    const delta = this.lastFrameTime ? now - this.lastFrameTime : 0.016;
    this.lastFrameTime = now;

    // Update orbit controls with damping
    if (this.orbitControls) {
      // Head tracking disabled to allow free camera orbit
      // Users can now orbit around the model without interference
      this.orbitControls.update();
    }

    // Update animation mixer
    if (this.animationMixer) {
      this.animationMixer.update(delta);

      // Switch idle animations on timer (since they loop forever)
      if (!this.animationCycle.isPlayingIntro && this.currentAnimation) {
        this.animationCycle.idleSwitchTimer += delta;
        if (this.animationCycle.idleSwitchTimer >= this.animationCycle.idleSwitchInterval) {
          this.animationCycle.idleSwitchTimer = 0;
          this.playNextIdleAnimation();
        }
      }
    }

    // Update drei-vanilla effects
    if (this.sparkles) {
      this.sparkles.update(now);
    }

    // Update camera shake
    if (this.cameraShake) {
      this.cameraShake.update(delta, now);
    }

    // Animate morph targets for natural facial movement
    this.animateMorphTargets(delta, now);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  // Public API for external control
  public setEnvironment(preset: 'studio' | 'sunset' | 'dawn' | 'night' | 'forest' | 'city') {
    this.setAttribute('environment', preset);
  }

  public resetCamera() {
    if (this.orbitControls) {
      this.camera.position.set(2, 1.2, 3.5);
      this.orbitControls.target.set(1, 1.5, 0);
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
if (!customElements.get('model-viewer')) {
  customElements.define('model-viewer', ModelViewer as any);
}
