/**
 * Scene 07 — Deterministic 4-Gate Workflow DAG Architecture (47.0s – 53.5s | Beats 95–107)
 */
window.SCENE_07_WORKFLOW_DAG = function (tl, fx) {
  const t0 = 47.0;

  fx.whipPanIn(tl, "#s07-stage", t0, { fromX: 140, duration: 0.45 });
  fx.maskReveal(tl, ["#s07-header", "#s07-title"], t0 + 0.15, { y: 24, stagger: 0.1, duration: 0.5 });

  // Staggered reveal of the 4 DAG Node Cards + SVG Connectors + Traveling Data Packets
  const nodes = ["#s07-node-1", "#s07-node-2", "#s07-node-3", "#s07-node-4"];
  nodes.forEach(function (sel, i) {
    tl.fromTo(
      sel,
      { y: 36, scale: 0.92, opacity: 0 },
      { y: 0, scale: 1.0, opacity: 1, duration: 0.55, ease: "overshoot" },
      t0 + 0.45 + i * 0.45
    );
  });

  // Draw SVG connectors + data pulse packets between Gate 1 -> 2 -> 3 -> 4
  fx.drawSvgConnector(tl, "#s07-conn-1", "#s07-dot-1", t0 + 0.75, {
    length: 180,
    duration: 0.55,
    fromX: 0,
    toX: 110
  });
  fx.drawSvgConnector(tl, "#s07-conn-2", "#s07-dot-2", t0 + 1.2, {
    length: 180,
    duration: 0.55,
    fromX: 0,
    toX: 110
  });
  fx.drawSvgConnector(tl, "#s07-conn-3", "#s07-dot-3", t0 + 1.65, {
    length: 180,
    duration: 0.55,
    fromX: 0,
    toX: 110
  });

  // Bottom telemetry architecture badges
  fx.maskReveal(tl, ["#s07-pill-1", "#s07-pill-2", "#s07-pill-3"], t0 + 2.3, {
    y: 22,
    stagger: 0.12,
    duration: 0.5
  });

  // Continuous data-flow elevation wave across the 4 nodes (49.8s – 53.1s)
  nodes.forEach(function (sel, i) {
    tl.to(
      sel,
      { y: -10, scale: 1.02, duration: 1.4, ease: "sine.inOut", immediateRender: false },
      t0 + 2.8 + i * 0.25
    ).to(
      sel,
      { y: 0, scale: 1.0, duration: 1.2, ease: "sine.inOut", immediateRender: false },
      t0 + 4.2 + i * 0.25
    );
  });

  // Zoom-through into Scene 08 CTA Lockup at 53.1s
  fx.zoomThroughOut(tl, "#s07-stage", t0 + 6.1, { scale: 1.2, duration: 0.38 });
};
