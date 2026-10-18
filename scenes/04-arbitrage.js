/**
 * Scene 04 — Gate 4 Liquidity Routing & Rail Arbitrage Benchmark (22.0s – 30.0s | Beats 45–60)
 */
window.SCENE_04_ARBITRAGE = function (tl, fx) {
  const t0 = 22.0;

  fx.whipPanIn(tl, "#s04-stage", t0, { fromX: 150, duration: 0.45 });

  fx.maskReveal(tl, ["#s04-header", "#s04-bench-card", "#s04-savings-card"], t0 + 0.2, {
    y: 30,
    stagger: 0.14,
    duration: 0.55
  });

  // Avalanche C-Chain progress bar rockets across in 0.45s while SWIFT wire crawls sluggishly
  tl.fromTo(
    "#s04-avax-bar",
    { scaleX: 0.02 },
    { scaleX: 1.0, duration: 0.55, ease: "snapOut" },
    t0 + 1.0
  );
  tl.fromTo(
    "#s04-swift-bar",
    { scaleX: 0.02 },
    { scaleX: 0.28, duration: 5.8, ease: "none" },
    t0 + 1.0
  );

  // Bloom pulse when Avalanche finishes the race at t = 23.55s
  fx.bloomPulse(tl, "#s04-emerald-glow", t0 + 1.5, { peakOpacity: 0.6, peakScale: 1.3, duration: 1.1 });

  // Odometer countUp for Savings ($110.00) and Fee Reduction (97.8%)
  fx.countUp(tl, "#s04-savings-num", t0 + 1.3, {
    from: 0,
    to: 110.0,
    decimals: 2,
    prefix: "$",
    duration: 1.4
  });
  fx.countUp(tl, "#s04-reduction-num", t0 + 1.4, {
    from: 0,
    to: 97.8,
    decimals: 1,
    suffix: "%",
    duration: 1.4
  });

  // Light sweep on the $110.00 net savings badge
  fx.lightSweep(tl, "#s04-savings-sweep", t0 + 2.8, { width: 540, duration: 0.85 });

  // Continuous subtle float on savings card across 25s – 29.5s
  tl.to(
    "#s04-savings-card",
    { y: -10, scale: 1.015, duration: 3.8, ease: "sine.inOut", immediateRender: false },
    t0 + 3.2
  );

  // Zoom-through into Scene 05 Settlement
  fx.zoomThroughOut(tl, "#s04-stage", t0 + 7.55, { scale: 1.24, duration: 0.42 });
};
