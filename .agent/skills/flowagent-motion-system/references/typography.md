# FlowAgent OS — Typography Scale & Local `@font-face` Contract

## Font Stack (Vendored in `assets/fonts/`)
- **Display & UI Sans**: `'Plus Jakarta Sans'` (`PlusJakartaSans-Regular.woff2`, `Medium`, `SemiBold`, `Bold`)
- **Editorial Serif Accent**: `'Instrument Serif'` (`InstrumentSerif-Italic.woff2`) — used exclusively on italic hero emphasis phrases (`Settlement out.`, `Wins by 97.8%.`, `Halted in 34ms.`)
- **Telemetry & Cryptographic Mono**: `'JetBrains Mono'` (`JetBrainsMono-Regular.woff2`, `SemiBold`, `Bold`) — used with `font-variant-numeric: tabular-nums` on all wallet hashes (`0x71C...`), block numbers (`#59490095`), and odometer counters.

## Scale (`1920×1080` Master vs `1080×1920` Portrait)
- **Hero H1**: `66px–76px` (`16:9`) / `84px–92px` (`9:16`), `line-height: 1.04`, `letter-spacing: -0.035em`
- **Scene H2**: `40px–48px` (`16:9`) / `62px–64px` (`9:16`), `line-height: 1.06`, `letter-spacing: -0.03em`
- **Primary Odometer Metric**: `84px–96px` (`JetBrains Mono Bold`)
- **Card Metric**: `32px–44px` (`JetBrains Mono Bold`)
- **Body / Advisory Copy**: `15px–21px` (`16:9`) / `21px–26px` (`9:16`), `line-height: 1.45–1.5`
