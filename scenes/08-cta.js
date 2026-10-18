/**
 * Scene 08 — Hero Proof Lockup & CTA Finale (53.5s – 60.0s | Beats 108–120)
 */
window.SCENE_08_CTA = function (tl, fx) {
  const t0 = 53.5;

  tl.fromTo(
    "#s08-stage",
    { scale: 0.94, opacity: 0 },
    { scale: 1.0, opacity: 1, duration: 0.5, ease: "snapOut" },
    t0
  );
  fx.bloomPulse(tl, "#s08-glow", t0 + 0.15, { peakOpacity: 0.65, peakScale: 1.35, duration: 1.4 });

  // Brand lockup + Headline reveal
  fx.maskReveal(tl, ["#s08-brand-pill", "#s08-h1", "#s08-sub"], t0 + 0.2, {
    y: 34,
    stagger: 0.14,
    duration: 0.6
  });

  // 3 Proof Metric Bento Cards
  fx.maskReveal(tl, ["#s08-stat-1", "#s08-stat-2", "#s08-stat-3"], t0 + 0.75, {
    y: 28,
    stagger: 0.12,
    duration: 0.55
  });

  // CTA Buttons & URL Pill
  fx.maskReveal(tl, ["#s08-cta-row", "#s08-url-bar"], t0 + 1.2, {
    y: 24,
    stagger: 0.14,
    duration: 0.55
  });

  // Cursor glides to click "Launch workstation" CTA + specular light sweep
  fx.cursorMoveAndClick(tl, "#s08-cursor", "#s08-ripple", "#s08-cta-primary", t0 + 1.5, {
    fromX: 1380,
    fromY: 960,
    toX: 760,
    toY: 888,
    moveDur: 0.75
  });
  fx.lightSweep(tl, "#s08-cta-sweep", t0 + 2.4, { width: 420, duration: 0.85 });
  fx.lightSweep(tl, "#s08-cta-sweep", t0 + 4.4, { width: 420, duration: 0.85 });

  // Continuous subtle breathing motion on the hero lockup until 60.0s
  tl.to(
    "#s08-hero-box",
    { y: -8, scale: 1.01, duration: 3.2, ease: "sine.inOut", immediateRender: false },
    t0 + 2.8
  );
};
