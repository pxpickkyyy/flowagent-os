/**
 * Scene 06 — Gate 3 Defense: 34ms Pre-Signature OFAC Sanctions Halt (38.0s – 47.0s | Beats 77–94)
 */
window.SCENE_06_OFAC_HALT = function (tl, fx) {
  const t0 = 38.0;

  // Aggressive entrance with RGB glitch hit + crimson strobe pulse (non-overlapping)
  tl.fromTo(
    "#s06-stage",
    { scale: 1.04, opacity: 0 },
    { scale: 1.0, opacity: 1, duration: 0.2, ease: "snapOut" },
    t0
  );
  fx.rgbGlitchHit(tl, "#s06-stage", t0 + 0.22, { intensity: 12 });
  fx.bloomPulse(tl, "#s06-danger-glow", t0 + 0.15, { peakOpacity: 0.65, peakScale: 1.35, duration: 1.2 });

  // Cursor clicks "Tornado Cash · 15,000 USDT · SANCTIONED" preset at t = 38.8s
  fx.cursorMoveAndClick(tl, "#s06-cursor", "#s06-ripple", "#s06-tornado-pill", t0 + 0.35, {
    fromX: 1560,
    fromY: 420,
    toX: 1420,
    toY: 98,
    moveDur: 0.55
  });

  // Sanctions Enforcement Banner + Shield slam in with overshoot
  tl.fromTo(
    "#s06-alert-banner",
    { scale: 0.88, y: 28, opacity: 0 },
    { scale: 1.0, y: 0, opacity: 1, duration: 0.55, ease: "overshoot" },
    t0 + 1.0
  );

  // 34ms Latency & 0.00 AVAX Gas Proof Cards
  fx.maskReveal(tl, ["#s06-wallet-box", "#s06-metric-latency", "#s06-metric-gas", "#s06-locked-btn"], t0 + 1.35, {
    y: 26,
    stagger: 0.14,
    duration: 0.55
  });

  fx.countUp(tl, "#s06-latency-val", t0 + 1.45, {
    from: 250,
    to: 34,
    decimals: 0,
    suffix: "ms",
    duration: 0.9
  });

  // Second micro-glitch + pulsing crimson radar ring across 41s – 46.4s
  fx.rgbGlitchHit(tl, "#s06-alert-banner", t0 + 3.2, { intensity: 6 });
  tl.to(
    "#s06-danger-glow",
    { scale: 1.18, opacity: 0.48, duration: 2.2, ease: "sine.inOut", immediateRender: false },
    t0 + 3.5
  ).to(
    "#s06-danger-glow",
    { scale: 0.95, opacity: 0.25, duration: 2.2, ease: "sine.inOut", immediateRender: false },
    t0 + 5.7
  );

  // De-escalate out to Scene 07 Architecture DAG at 46.6s
  fx.whipPanOut(tl, "#s06-stage", t0 + 8.6, { toX: -140, duration: 0.38 });
};
