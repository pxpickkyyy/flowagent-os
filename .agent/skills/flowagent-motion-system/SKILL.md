---
name: flowagent-motion-system
description: >
  Reusable HyperFrames + GSAP motion design system for FlowAgent OS ("Autonomous accounts payable · Avalanche").
  Use when authoring, extending, or re-rendering FlowAgent OS product launch videos, vertical social cutdowns,
  feature explainers, or interactive UI showcases with deterministic 60fps GSAP choreography.
---

# FlowAgent OS — HyperFrames Motion Design System

This skill codifies the exact brand tokens, typography, custom easing curves, 8-scene archetypes, and seek-safe GSAP primitives used to produce the FlowAgent OS product launch videos (`16:9` 60s master, `9:16` 30s vertical cutdown, and `6s` seamless loop).

## Quick Start Commands

```bash
# 1. Static + Browser QA Gate (lint, runtime, layout, motion sidecar, WCAG contrast)
npx hyperframes check --json

# 2. Export verification snapshots across all 8 scenes
npx hyperframes snapshot --at 2.5,8.5,16.5,25.5,33.5,41.5,50.5,56.5

# 3. Render 16:9 Master (1920x1080, 60fps, 60s)
npx hyperframes render --fps 60 --quality delivery --output renders/flowagent-os-demo_16x9.mp4

# 4. Render 9:16 Vertical Cutdown (1080x1920, 60fps, 30s)
npx hyperframes render -c portrait.html --fps 60 --quality delivery --output renders/flowagent-os-demo_9x16.mp4

# 5. Render 6s Seamless Hero Loop (MP4 + WebM)
npx hyperframes render -c loop.html --fps 60 --quality delivery --output renders/flowagent-os-loop.mp4
npx hyperframes render -c loop.html --fps 60 --format webm --output renders/flowagent-os-loop.webm
```

## Core Architecture Rules

1. **Single Source of Truth (`config.js`)**: All product copy, metrics (`0.09s`, `97.8%`, `34ms`, `$112.50` vs `$2.50`), palette tokens, and beat timings (`120 BPM` = `0.5s`/beat) live in `config.js`.
2. **Deterministic Paused Timeline**: Always construct a single `const tl = gsap.timeline({ paused: true })` and register `window.__timelines["main"] = tl` at the end of initialization.
3. **Seeded PRNG Only (`mulberry32`)**: Never call `Math.random()`, `Date.now()`, or `performance.now()`. Use `window.FLOWAGENT_FX.mulberry32(seed)` so parallel render workers produce byte-identical frames.
4. **Zero CSS/GSAP Transform Conflicts**: Never apply CSS `transform` on elements animated by GSAP (`x`, `y`, `scale`, `rotation`).
5. **Local Vendored Assets**: Always load `assets/vendor/gsap.min.js`, `assets/vendor/CustomEase.min.js`, and local `.woff2` fonts in `assets/fonts/` via in-file `@font-face` declarations.

## Reference Guides

- [Brand Palette & Glass Surface Tokens](references/palette.md)
- [Typography Scale & Local Font-Face Contract](references/typography.md)
- [Custom Easing Curves & Beat Grid](references/easing-curves.md)
- [8 Scene Archetypes & Camera Moves](references/scene-archetypes.md)
- [Reusable GSAP FX Snippets (`lib/fx.js`)](references/gsap-snippets.md)
