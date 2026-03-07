# WebGL/GPU Container Issue Investigation

## Summary

The container **DOES** have access to the NVIDIA GPU. The RTX 3060 is visible and accessible from within the container. However, WebGL context creation may still fail in certain browser automation scenarios.

## Current Status

### ✅ GPU Access Confirmed
```bash
$ nvidia-smi
NVIDIA-SMI 580.105.08             Driver Version: 580.105.08     CUDA Version: 13.0
GPU 0: NVIDIA GeForce RTX 3060 (8GB VRAM)

$ ls -la /dev/nvidia*
/dev/nvidia0, /dev/nvidiactl, /dev/nvidia-modeset, /dev/nvidia-uvm (all accessible)
```

### ✅ Chromium Running with GPU Support
- Chromium is running with `--enable-gpu-rasterization`
- GPU process is active (`--type=gpu-process`)
- X11 display available at `DISPLAY=:1.0`

### ⚠️ Potential Issues

1. **Headless/Browser Automation Context**: When accessing the site via browser automation tools, the WebGL context may fail to initialize due to:
   - Security sandbox restrictions
   - Missing `--enable-webgl` flags
   - GPU acceleration disabled in headless mode

2. **Missing Chromium Flags**: The browser may need additional flags:
   ```
   --enable-webgl
   --ignore-gpu-blocklist
   --enable-gpu-rasterization
   --enable-zero-copy
   --enable-features=VaapiVideoDecode,CanvasOopRasterization
   ```

## Recommended Fixes

### Option 1: Browser Launch Flags (Recommended)

When launching Chromium for browser automation, use these flags:

```javascript
const browser = await puppeteer.launch({
  headless: false,  // or 'new' for headless with GPU
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--enable-gpu-rasterization',
    '--enable-zero-copy',
    '--use-gl=egl',  // or 'desktop' for desktop GL
    '--enable-features=VaapiVideoDecode,CanvasOopRasterization',
    '--disable-features=IsolateOrigins,site-per-process',
  ]
});
```

### Option 2: Three.js Software Rendering Fallback

Modify `ModelViewer.ts` to detect WebGL failure and show a fallback:

```typescript
private initThreeJS() {
  const container = this.shadowRoot?.getElementById('canvas-container');
  if (!container) return;

  // Try WebGLRenderer first
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext | null;
  
  try {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      throw new Error('WebGL not supported');
    }
  } catch (e) {
    console.warn('WebGL initialization failed:', e);
    this.showSoftwareFallback();
    return;
  }

  // Continue with normal WebGLRenderer setup...
  this.renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    canvas: canvas
  });
}

private showSoftwareFallback() {
  const container = this.shadowRoot?.getElementById('canvas-container');
  if (!container) return;
  
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
      background: rgba(255, 0, 255, 0.1);
      border: 2px solid #ff00ff;
      border-radius: 1rem;
    ">
      <div style="font-size: 4rem; margin-bottom: 1rem;">🤡</div>
      <h2 style="color: #ff00ff; margin-bottom: 1rem;">Cleetus</h2>
      <p style="color: #ffffff; max-width: 300px;">
        WebGL is not available in this environment.
        <br><br>
        Cleetus is hiding! Try viewing on a device with GPU support.
      </p>
    </div>
  `;
}
```

### Option 3: Docker GPU Runtime (If Using Docker)

If running in Docker, ensure GPU access:

```bash
# Run with NVIDIA runtime
docker run --gpus all --runtime=nvidia -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix your-image

# Or in docker-compose.yml:
services:
  app:
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=all
    volumes:
      - /tmp/.X11-unix:/tmp/.X11-unix
    environment:
      - DISPLAY=:1.0
```

## Checking GPU Access from Container

```bash
# Check NVIDIA driver
nvidia-smi

# Check device files
ls -la /dev/nvidia*

# Check OpenGL (if available)
glxinfo | grep "OpenGL renderer"

# Check X11
echo $DISPLAY
ls -la /tmp/.X11-unix/
```

## Browser WebGL Test

Open the browser console and run:
```javascript
// Test WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);
console.log('WebGL2:', canvas.getContext('webgl2') !== null);

// Check renderer
if (gl) {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    console.log('GPU Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
    console.log('GPU Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
  }
}
```

## Conclusion

The container **does** have GPU access. The WebGL issue is likely related to browser security/context when running under automation. The best fixes are:

1. **Immediate**: Add proper Chromium launch flags for WebGL/GPU support
2. **Short-term**: Implement WebGL detection and graceful fallback UI
3. **Long-term**: Consider pre-rendering or using a GPU-enabled browser instance

## Files Changed

- `client/index.html`: Updated title from "VRM Avatar Showcase" to "Cleetus - Free from SpiceX 🌶️"
