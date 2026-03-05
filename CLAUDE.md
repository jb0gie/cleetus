# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VRM Avatar Showcase - A WebJSX-based 3D avatar viewer featuring "Cleetus", a pink-themed VRM avatar. Built with native Web Components, Three.js, and @pixiv/three-vrm.

## Architecture

### Tech Stack
- **Framework**: WebJSX (no React) - JSX for native Web Components
- **3D Engine**: Three.js with @pixiv/three-vrm for VRM avatar support
- **Styling**: Tailwind CSS v4 with custom CSS in Shadow DOM
- **Build**: Vite 7 with esbuild for server
- **Package Manager**: npm (with pnpm lockfile present)

### Project Structure

```
/home/blank/cleetus/
├── client/                    # Frontend application
│   ├── index.html            # Entry HTML
│   ├── public/               # Static assets
│   │   └── Cleetus.vrm      # Main VRM avatar (6.19MB)
│   └── src/
│       ├── main.ts          # App entry point
│       ├── components/
│       │   ├── AvatarShowcase.ts   # Main showcase component
│       │   └── VRMViewer.ts        # 3D VRM viewer with controls
│       ├── lib/
│       │   └── utils.ts     # Utility functions (cn helper)
│       └── const.ts         # Client constants
├── server/                   # Express server
│   └── index.ts             # Static file server
├── shared/                   # Shared code
│   └── const.ts             # Shared constants
├── dist/                     # Build output
├── package.json
├── tsconfig.json            # TypeScript config (jsxImportSource: webjsx)
└── vite.config.ts           # Vite configuration
```

## Key Components

### VRMViewer (`client/src/components/VRMViewer.ts`)
Native Web Component for 3D avatar rendering.

**Features:**
- OrbitControls for camera (rotate, zoom, pan with damping)
- 6 environment presets: studio, sunset, dawn, night, forest, city
- Soft shadows with PCFSoftShadowMap
- 3-point lighting (main, fill, rim)
- Auto-centering and scaling

**HTML API:**
```html
<vrm-viewer environment="studio" shadows="true"></vrm-viewer>
```

**JavaScript API:**
```typescript
viewer.setEnvironment('sunset');
viewer.setShadows(false);
viewer.resetCamera();
```

### AvatarShowcase (`client/src/components/AvatarShowcase.ts`)
Main page layout component with pink color theme.

## Common Commands

```bash
# Development
npm run dev              # Start Vite dev server (port 3000)

# Build
npm run build            # Build client + server to dist/
npm run check            # TypeScript type check

# Production
npm start                # Run production server (dist/index.js)
```

## Build System

### Vite Configuration
- Entry: `client/index.html` → `client/src/main.ts`
- Output: `dist/public/` (client), `dist/index.js` (server)
- Plugins: tailwindcss, vite-plugin-manus-runtime, custom debug collector
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`

### TypeScript
- JSX pragma: `webjsx` (native Web Components, not React)
- Module: ESNext with Bundler resolution
- Strict mode enabled

## Color Scheme

Pink-themed to match Cleetus avatar:
- Primary: `#ec4899` (pink-500)
- Secondary: `#be185d` (pink-700)
- Background: `#fce7f3` (pink-100) to `#fbcfe8` (pink-200)
- Accents: `#f472b6` (pink-400)

## Development Notes

### Web Component Patterns
- Components extend `HTMLElement`
- Use `attachShadow({ mode: 'open' })` for encapsulation
- Styles defined in Shadow DOM with `<style>` tags
- Lifecycle: `connectedCallback()`, `disconnectedCallback()`
- Attribute changes via `attributeChangedCallback()`

### Three.js Integration
- Scene background and fog use pink theme colors
- VRM models auto-center using BoundingBox
- Shadow plane uses `ShadowMaterial` for soft contact shadows
- ResizeObserver handles responsive canvas sizing

### File Conventions
- Web Components: `PascalCase.ts` (e.g., `VRMViewer.ts`)
- Utilities: `camelCase.ts` (e.g., `utils.ts`)
- One component per file with custom element registration at bottom

## Environment Variables

None currently required for basic operation. The VRM viewer defaults to loading `/Cleetus.vrm`.

## Dependencies to Know

- `@pixiv/three-vrm`: VRM format support for Three.js
- `@pmndrs/vanilla`: drei-inspired utilities (installed, used for reference)
- `three`: Core 3D engine
- `webjsx`: JSX transform for native Web Components
- `tailwindcss`: Utility CSS framework

## Testing

No test suite currently configured. Vitest is installed but unused.

## Deployment

Static files served from `dist/public/` via Express server. Supports SPA routing (all routes serve index.html).
