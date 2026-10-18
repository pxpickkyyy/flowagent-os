# FlowAgent OS — Reusable GSAP FX Snippets (`lib/fx.js`)

## 1. Staggered Line Mask Reveal
```js
fx.maskReveal(tl, ["#s01-h1-1", "#s01-h1-2", "#s01-h1-3"], 0.35, {
  y: 52,
  stagger: 0.14,
  duration: 0.65,
  ease: "snapOut"
});
```

## 2. Cursor Path + Tactile Click Squish + Ripple
```js
fx.cursorMoveAndClick(tl, "#s05-cursor", "#s05-ripple", "#s05-auth-btn", 30.5, {
  fromX: 1350,
  fromY: 780,
  toX: 460,
  toY: 540,
  moveDur: 0.65
});
```

## 3. Seek-Safe Tabular Odometer Counter
```js
fx.countUp(tl, "#s04-savings-num", 23.3, {
  from: 0,
  to: 110.0,
  decimals: 2,
  prefix: "$",
  duration: 1.4
});
```

## 4. 6-Frame Chromatic RGB Glitch Hit
```js
fx.rgbGlitchHit(tl, "#s06-stage", 38.1, { intensity: 12 });
```

## 5. SVG Connector Draw + Data Packet Pulse
```js
fx.drawSvgConnector(tl, "#s07-conn-1", "#s07-dot-1", 47.75, {
  length: 180,
  duration: 0.55,
  fromX: 0,
  toX: 110
});
```
