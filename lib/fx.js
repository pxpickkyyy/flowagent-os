/**
 * FlowAgent OS — Deterministic GSAP Motion & Visual FX Library (lib/fx.js)
 * Zero Math.random(), Date.now(), or performance.now().
 * All motion is seek-safe and registered onto the master paused GSAP timeline.
 */
(function () {
  if (typeof window.gsap !== "undefined" && typeof window.CustomEase !== "undefined") {
    gsap.registerPlugin(CustomEase);
    CustomEase.create("snapOut", "0.16, 1, 0.3, 1");
    CustomEase.create("dramaticInOut", "0.85, 0, 0.15, 1");
    CustomEase.create("overshoot", "0.34, 1.56, 0.64, 1");
    CustomEase.create("whipPan", "0.7, 0, 0.2, 1");
  }

  /**
   * Mulberry32 deterministic PRNG
   */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Staggered line/word reveal from overflow-hidden mask
   */
  function maskReveal(tl, targets, at, opts) {
    const o = Object.assign(
      { duration: 0.65, stagger: 0.08, y: 42, ease: "snapOut", immediateRender: true },
      opts || {}
    );
    tl.fromTo(
      targets,
      { y: o.y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: o.duration,
        stagger: o.stagger,
        ease: o.ease,
        immediateRender: o.immediateRender
      },
      at
    );
  }

  /**
   * Specular light sweep across a hero word, badge, or CTA button
   */
  function lightSweep(tl, sweepEl, at, opts) {
    const o = Object.assign({ width: 520, duration: 0.75, ease: "dramaticInOut" }, opts || {});
    tl.fromTo(
      sweepEl,
      { x: -160, opacity: 0, skewX: -20 },
      { x: o.width, opacity: 0.9, skewX: -20, duration: o.duration * 0.6, ease: o.ease, immediateRender: false },
      at
    ).to(
      sweepEl,
      { opacity: 0, duration: o.duration * 0.4, ease: "power2.out", immediateRender: false },
      at + o.duration * 0.6
    );
  }

  /**
   * 6-frame RGB chromatic aberration + horizontal micro-shake hit
   */
  function rgbGlitchHit(tl, targetEl, at, opts) {
    const o = Object.assign({ intensity: 10 }, opts || {});
    const frame = 1 / 60;
    const offsets = [
      { x: -o.intensity, y: 2, scale: 1.012 },
      { x: o.intensity, y: -3, scale: 1.015 },
      { x: -o.intensity * 0.6, y: 1, scale: 0.996 },
      { x: o.intensity * 0.5, y: -1, scale: 1.008 },
      { x: -3, y: 0, scale: 1.002 },
      { x: 0, y: 0, scale: 1.0 }
    ];
    offsets.forEach(function (step, i) {
      tl.to(
        targetEl,
        {
          x: step.x,
          y: step.y,
          scale: step.scale,
          duration: frame * 1.5,
          ease: "none",
          immediateRender: false
        },
        at + i * frame * 1.5
      );
    });
  }

  /**
   * Whip-pan scene entrance & exit
   */
  function whipPanIn(tl, stageEl, at, opts) {
    const o = Object.assign({ fromX: 140, duration: 0.45 }, opts || {});
    tl.fromTo(
      stageEl,
      { x: o.fromX, scale: 0.96, opacity: 0 },
      { x: 0, scale: 1, opacity: 1, duration: o.duration, ease: "snapOut" },
      at
    );
  }

  function whipPanOut(tl, stageEl, at, opts) {
    const o = Object.assign({ toX: -140, duration: 0.35 }, opts || {});
    tl.to(
      stageEl,
      { x: o.toX, scale: 0.96, opacity: 0, duration: o.duration, ease: "whipPan", immediateRender: false },
      at
    );
  }

  /**
   * Zoom-through Z-axis camera punch
   */
  function zoomThroughOut(tl, stageEl, at, opts) {
    const o = Object.assign({ scale: 1.28, duration: 0.42 }, opts || {});
    tl.to(
      stageEl,
      { scale: o.scale, opacity: 0, duration: o.duration, ease: "dramaticInOut", immediateRender: false },
      at
    );
  }

  /**
   * 3D Perspective Camera Push / Tilt
   */
  function cameraPush(tl, targetEl, at, opts) {
    const o = Object.assign(
      {
        fromRotX: 8,
        fromRotY: -10,
        fromScale: 0.92,
        toRotX: 0,
        toRotY: 0,
        toScale: 1.0,
        duration: 1.1
      },
      opts || {}
    );
    tl.fromTo(
      targetEl,
      { rotationX: o.fromRotX, rotationY: o.fromRotY, scale: o.fromScale, opacity: 0 },
      {
        rotationX: o.toRotX,
        rotationY: o.toRotY,
        scale: o.toScale,
        opacity: 1,
        duration: o.duration,
        ease: "snapOut"
      },
      at
    );
  }

  /**
   * Simulated Cursor Path + Tactile Click Squish + Concentric Ripple
   */
  function cursorMoveAndClick(tl, cursorEl, rippleEl, buttonEl, at, coords) {
    const c = Object.assign(
      { fromX: 1200, fromY: 780, toX: 640, toY: 420, moveDur: 0.65 },
      coords || {}
    );
    tl.fromTo(
      cursorEl,
      { x: c.fromX, y: c.fromY, opacity: 0, scale: 1 },
      { x: c.toX, y: c.toY, opacity: 1, scale: 1, duration: c.moveDur, ease: "snapOut" },
      at
    );
    const clickAt = at + c.moveDur;
    tl.to(cursorEl, { scale: 0.84, duration: 0.08, ease: "power2.in", immediateRender: false }, clickAt)
      .to(cursorEl, { scale: 1.0, duration: 0.16, ease: "overshoot", immediateRender: false }, clickAt + 0.08);

    if (buttonEl) {
      tl.to(buttonEl, { scale: 0.96, duration: 0.08, ease: "power2.in", immediateRender: false }, clickAt)
        .to(buttonEl, { scale: 1.02, duration: 0.18, ease: "overshoot", immediateRender: false }, clickAt + 0.08)
        .to(buttonEl, { scale: 1.0, duration: 0.15, ease: "power2.out", immediateRender: false }, clickAt + 0.26);
    }

    if (rippleEl) {
      tl.fromTo(
        rippleEl,
        { scale: 0.25, opacity: 0.95 },
        { scale: 2.35, opacity: 0, duration: 0.55, ease: "snapOut", immediateRender: false },
        clickAt
      );
    }
  }

  /**
   * Deterministic seek-safe number counter (countUp)
   */
  function countUp(tl, selectorOrEl, at, opts) {
    const o = Object.assign(
      { from: 0, to: 100, decimals: 0, prefix: "", suffix: "", duration: 1.0, ease: "snapOut" },
      opts || {}
    );
    const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!el) return;
    const proxy = { val: o.from };
    tl.fromTo(
      proxy,
      { val: o.from },
      {
        val: o.to,
        duration: o.duration,
        ease: o.ease,
        onUpdate: function () {
          el.textContent = o.prefix + proxy.val.toFixed(o.decimals) + o.suffix;
        }
      },
      at
    );
  }

  /**
   * SVG Connector Line Draw + Data Pulse Packet
   */
  function drawSvgConnector(tl, pathEl, dotEl, at, opts) {
    const o = Object.assign({ length: 240, duration: 0.65, fromX: 0, toX: 220 }, opts || {});
    if (pathEl) {
      tl.fromTo(
        pathEl,
        { strokeDasharray: o.length, strokeDashoffset: o.length, opacity: 0.3 },
        { strokeDashoffset: 0, opacity: 1, duration: o.duration, ease: "snapOut" },
        at
      );
    }
    if (dotEl) {
      tl.fromTo(
        dotEl,
        { x: o.fromX, opacity: 0, scale: 0.5 },
        { x: o.toX, opacity: 1, scale: 1.15, duration: o.duration, ease: "dramaticInOut" },
        at
      );
    }
  }

  /**
   * Radial Bloom Pulse on Beat
   */
  function bloomPulse(tl, glowEl, at, opts) {
    const o = Object.assign({ peakOpacity: 0.55, peakScale: 1.25, duration: 0.8 }, opts || {});
    tl.fromTo(
      glowEl,
      { scale: 0.85, opacity: 0.15 },
      { scale: o.peakScale, opacity: o.peakOpacity, duration: o.duration * 0.45, ease: "snapOut", immediateRender: false },
      at
    ).to(
      glowEl,
      { scale: 1.0, opacity: 0.22, duration: o.duration * 0.55, ease: "power2.out", immediateRender: false },
      at + o.duration * 0.45
    );
  }

  window.FLOWAGENT_FX = {
    mulberry32: mulberry32,
    maskReveal: maskReveal,
    lightSweep: lightSweep,
    rgbGlitchHit: rgbGlitchHit,
    whipPanIn: whipPanIn,
    whipPanOut: whipPanOut,
    zoomThroughOut: zoomThroughOut,
    cameraPush: cameraPush,
    cursorMoveAndClick: cursorMoveAndClick,
    countUp: countUp,
    drawSvgConnector: drawSvgConnector,
    bloomPulse: bloomPulse
  };
})();
