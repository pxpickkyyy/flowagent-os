/**
 * Scene 05 — Gate 3: 0.09s Snowman BFT Settlement & Cryptographic Receipt (30.0s – 38.0s | Beats 61–76)
 */
window.SCENE_05_SETTLEMENT = function (tl, fx) {
  const t0 = 30.0;

  tl.fromTo(
    "#s05-stage",
    { scale: 0.93, opacity: 0 },
    { scale: 1.0, opacity: 1, duration: 0.45, ease: "snapOut" },
    t0
  );

  fx.maskReveal(tl, ["#s05-header", "#s05-exec-card", "#s05-receipt-card"], t0 + 0.18, {
    y: 30,
    stagger: 0.12,
    duration: 0.55
  });

  // Cursor moves and clicks "Authorize Settlement · $2,500.00 USDC" at t = 31.1s
  fx.cursorMoveAndClick(tl, "#s05-cursor", "#s05-ripple", "#s05-auth-btn", t0 + 0.5, {
    fromX: 960,
    fromY: 820,
    toX: 490,
    toY: 625,
    moveDur: 0.65
  });

  // Finality timer locks at 0.09s (90ms)
  fx.countUp(tl, "#s05-finality-val", t0 + 1.2, {
    from: 1.45,
    to: 0.09,
    decimals: 2,
    suffix: "s",
    duration: 0.85
  });
  fx.bloomPulse(tl, "#s05-bft-glow", t0 + 1.25, { peakOpacity: 0.65, peakScale: 1.35, duration: 1.0 });

  // Cryptographic Execution Receipt rows & Snowtrace verification pill reveal
  fx.maskReveal(tl, ["#s05-settled-pill", "#s05-tx-row", "#s05-csv-toast"], t0 + 1.8, {
    y: 22,
    stagger: 0.16,
    duration: 0.55
  });

  // Second cursor action: glides to click "Export Reconciliation CSV" at t = 34.0s
  tl.to(
    "#s05-cursor",
    { x: 1380, y: 882, duration: 0.75, ease: "snapOut", immediateRender: false },
    t0 + 3.1
  )
    .to("#s05-cursor", { scale: 0.85, duration: 0.08, immediateRender: false }, t0 + 3.85)
    .to("#s05-cursor", { scale: 1.0, duration: 0.16, ease: "overshoot", immediateRender: false }, t0 + 3.93);

  fx.lightSweep(tl, "#s05-receipt-sweep", t0 + 4.2, { width: 640, duration: 0.9 });

  // Keep subtle motion alive until 37.5s
  tl.to(
    "#s05-receipt-card",
    { y: -8, duration: 2.8, ease: "sine.inOut", immediateRender: false },
    t0 + 4.5
  );

  // Beat 76 Transition Out: Hard RGB glitch hit right before Scene 06 OFAC Halt!
  fx.rgbGlitchHit(tl, "#s05-stage", t0 + 7.55, { intensity: 14 });
  tl.to("#s05-stage", { opacity: 0, duration: 0.18, immediateRender: false }, t0 + 7.8);
};
