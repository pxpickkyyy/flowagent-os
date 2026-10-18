/**
 * Scene 01 — Hook & Hero Z-Axis Cascade (0.0s – 6.0s | Beats 1–12 @ 120 BPM)
 */
window.SCENE_01_HOOK = function (tl, fx) {
  const t0 = 0.0;

  // Stage entrance & ambient orb pulse
  tl.fromTo(
    "#s01-stage",
    { scale: 1.04, opacity: 0 },
    { scale: 1.0, opacity: 1, duration: 0.45, ease: "snapOut" },
    t0
  );
  fx.bloomPulse(tl, "#s01-glow", t0 + 0.1, { peakOpacity: 0.55, peakScale: 1.25, duration: 1.4 });

  // Top HUD bar + eyebrow pill reveal
  fx.maskReveal(tl, ["#s01-topbar", "#s01-eyebrow"], t0 + 0.15, { y: -24, stagger: 0.1, duration: 0.5 });

  // Staggered kinetic H1 lines ("Invoices in." / "Settlement out." / "Sub-second.")
  fx.maskReveal(tl, ["#s01-h1-1", "#s01-h1-2", "#s01-h1-3"], t0 + 0.35, {
    y: 52,
    stagger: 0.14,
    duration: 0.65
  });

  // Specular light sweep across "Settlement out."
  fx.lightSweep(tl, "#s01-h1-sweep", t0 + 1.0, { width: 520, duration: 0.85 });

  // Subtitle + Problem contrast pill
  fx.maskReveal(tl, ["#s01-sub", "#s01-problem-pill"], t0 + 1.1, { y: 28, stagger: 0.12, duration: 0.55 });

  // Right-side 3-Layer Z-Axis Hero Cascade Cards fan out in 3D perspective
  tl.fromTo(
    "#s01-card-back",
    { x: 110, y: -40, scale: 0.86, rotationY: -18, rotationX: 8, opacity: 0 },
    { x: 0, y: 0, scale: 0.94, rotationY: -8, rotationX: 4, opacity: 0.88, duration: 0.75, ease: "snapOut" },
    t0 + 0.6
  );
  tl.fromTo(
    "#s01-card-mid",
    { x: 130, y: 20, scale: 0.88, rotationY: -18, rotationX: 8, opacity: 0 },
    { x: 0, y: 0, scale: 0.97, rotationY: -6, rotationX: 3, opacity: 0.94, duration: 0.75, ease: "snapOut" },
    t0 + 0.85
  );
  tl.fromTo(
    "#s01-card-front",
    { x: 150, y: 70, scale: 0.9, rotationY: -18, rotationX: 8, opacity: 0 },
    { x: 0, y: 0, scale: 1.0, rotationY: -4, rotationX: 2, opacity: 1, duration: 0.8, ease: "overshoot" },
    t0 + 1.1
  );

  // Proof Bar 3 metrics reveal + countUp on beat 4 (t = 1.4s -> locked by 2.25s)
  fx.maskReveal(tl, ["#s01-m1", "#s01-m2", "#s01-m3"], t0 + 1.25, { y: 30, stagger: 0.1, duration: 0.5 });
  fx.countUp(tl, "#s01-m1-val", t0 + 1.35, { from: 1.85, to: 0.09, decimals: 2, suffix: "s", duration: 0.8 });
  fx.countUp(tl, "#s01-m2-val", t0 + 1.4, { from: 12.0, to: 97.8, decimals: 1, suffix: "%", duration: 0.8 });
  fx.countUp(tl, "#s01-m3-val", t0 + 1.45, { from: 450, to: 34, decimals: 0, suffix: "ms", duration: 0.8 });

  // Continuous parallax float across 2.5s–5.5s so the frame is always alive
  tl.to(
    "#s01-card-front",
    { y: -12, rotationY: -1, duration: 2.6, ease: "sine.inOut", immediateRender: false },
    t0 + 2.5
  );
  tl.to(
    "#s01-card-mid",
    { y: -7, rotationY: -3, duration: 2.6, ease: "sine.inOut", immediateRender: false },
    t0 + 2.5
  );
  tl.to(
    "#s01-radar-line",
    { x: 480, opacity: 0.85, duration: 2.8, ease: "none", immediateRender: false },
    t0 + 2.4
  );

  // Beat 12 Transition Out: Whip-pan left into Scene 02
  fx.whipPanOut(tl, "#s01-stage", t0 + 5.6, { toX: -160, duration: 0.38 });
};
