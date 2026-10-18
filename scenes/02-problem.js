/**
 * Scene 02 — Problem Contrast & 4-Gate Workstation Reveal (6.0s – 13.0s | Beats 13–26 @ 120 BPM)
 */
window.SCENE_02_PROBLEM = function (tl, fx) {
  const t0 = 6.0;

  // Whip-pan entrance
  fx.whipPanIn(tl, "#s02-stage", t0, { fromX: 160, duration: 0.45 });

  // Header & Eyebrow reveal
  fx.maskReveal(tl, ["#s02-eyebrow", "#s02-title", "#s02-subtitle"], t0 + 0.2, {
    y: 32,
    stagger: 0.1,
    duration: 0.55
  });

  // 3D Perspective Camera Push into Browser Frame + 4-Gate Workstation
  fx.cameraPush(tl, "#s02-browser-shell", t0 + 0.45, {
    fromRotX: 10,
    fromRotY: -8,
    fromScale: 0.91,
    toRotX: 0,
    toRotY: 0,
    toScale: 1.0,
    duration: 1.2
  });

  // Staggered Scenario Presets (AWS, NodeOps, Tornado Cash)
  fx.maskReveal(tl, ["#s02-preset-1", "#s02-preset-2", "#s02-preset-3"], t0 + 1.1, {
    y: 22,
    stagger: 0.12,
    duration: 0.5
  });

  // 4-Gate Cards cascade in
  fx.maskReveal(tl, ["#s02-g1", "#s02-g2", "#s02-g3", "#s02-g4"], t0 + 1.5, {
    y: 28,
    stagger: 0.12,
    duration: 0.55
  });

  // Sequential highlight pulse across the 3 Scenario Pills + 4 Gates (keeps motion continuous)
  tl.to("#s02-preset-1", { scale: 1.03, duration: 0.6, ease: "sine.inOut", immediateRender: false }, t0 + 2.4)
    .to("#s02-preset-1", { scale: 1.0, duration: 0.5, ease: "sine.inOut", immediateRender: false }, t0 + 3.0)
    .to("#s02-preset-2", { scale: 1.03, duration: 0.6, ease: "sine.inOut", immediateRender: false }, t0 + 3.4)
    .to("#s02-preset-2", { scale: 1.0, duration: 0.5, ease: "sine.inOut", immediateRender: false }, t0 + 4.0)
    .to("#s02-preset-3", { scale: 1.03, duration: 0.6, ease: "sine.inOut", immediateRender: false }, t0 + 4.4)
    .to("#s02-preset-3", { scale: 1.0, duration: 0.5, ease: "sine.inOut", immediateRender: false }, t0 + 5.0);

  // Subtle camera drift on the workstation shell
  tl.to(
    "#s02-browser-shell",
    { y: -8, scale: 1.015, duration: 3.8, ease: "sine.inOut", immediateRender: false },
    t0 + 2.5
  );

  // Zoom-through transition out at 12.55s
  fx.zoomThroughOut(tl, "#s02-stage", t0 + 6.55, { scale: 1.22, duration: 0.42 });
};
