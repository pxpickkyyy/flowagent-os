# FlowAgent OS — Product Demo Video Credits & Asset Provenance

## 1. Visual Assets & Product Captures
- **Source Application**: [FlowAgent OS](https://flowagent-os.vercel.app/) (`frontend/src/App.tsx`)
- **4K Product Captures (`3840×2160` @ 2x DPR)**:
  - `assets/captures/01-hero-desktop.png` — Live Hero & 3-Layer Cascade Cards capture
  - `assets/captures/01-hero-mobile.png` — Portrait mobile crop (`780×1688`)
  - `assets/captures/02-section-workstation-aws.png` — Gate 1 Commercial Invoice Ingestion (`INV-2026-901`)
  - `assets/captures/03-section-ubot-copilot.png` — Gate 2 U-Bot Financial Copilot & Tokenomist Unlock Telemetry
  - `assets/captures/04-section-arbitrage-race.png` — Gate 4 Liquidity Routing & Settlement Benchmark (`SWIFT $112.50` vs `Avalanche $2.50`)
  - `assets/captures/05-section-snowman-settled.png` — Gate 3 & 4 Snowman BFT `0.09s` Settlement & Cryptographic Receipt
  - `assets/captures/06-section-ofac-terminated.png` — Gate 3 OFAC SDN `34ms` Sanctions Enforcement Halt (`Tornado Cash Router`)
- **Vector Graphics**:
  - `assets/svg/logo-mark.svg` — FlowAgent OS emblem (Original project vector, MIT)
  - `assets/svg/avalanche-badge.svg` — Avalanche C-Chain emblem

## 2. Typography (Local Vendored `.woff2`)
- **Plus Jakarta Sans** (`400`, `500`, `600`, `700`) — `@fontsource/plus-jakarta-sans` (OFL-1.1)
- **JetBrains Mono** (`400`, `600`, `700`) — `@fontsource/jetbrains-mono` (OFL-1.1)
- **Instrument Serif** (`400 Italic`) — `@fontsource/instrument-serif` (OFL-1.1)

## 3. Animation Runtime & Libraries (Local Vendored)
- **HyperFrames Engine & CLI** (`v0.8.163`) — Frame-accurate headless Chromium composition renderer
- **GSAP Core & CustomEase** (`v3.15.0`) — `assets/vendor/gsap.min.js`, `assets/vendor/CustomEase.min.js` (Standard "No Charge" GSAP License)
- **Deterministic FX Primitives** — `lib/fx.js` (`mulberry32(1337)` seeded PRNG, zero `Math.random()`)

## 4. Audio & Voiceover Provenance
- **Ambient Score (`assets/audio/bgm_ambient.mp3`)**: Procedural institutional dark-synth ambient bed (`120 BPM`, generated locally via `generate_sfx.mjs`)
- **Executive Voiceover (`assets/audio/vo_scene_1.mp3` – `vo_scene_6.mp3`)**: Synthesized via ElevenLabs Neural TTS (`elevenlabs_narrator.mjs`)
- **UI & Transition Sound Effects (`assets/audio/sfx_*.mp3`)**:
  - `sfx_riser.mp3` — Sub-bass transition riser
  - `sfx_click.mp3` — Tactile mechanical UI click
  - `sfx_confirm.mp3` — Harmonic emerald BFT finality chime
  - `sfx_alert.mp3` — OFAC SDN compliance firewall klaxon
