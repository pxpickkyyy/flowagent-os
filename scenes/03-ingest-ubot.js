/**
 * Scene 03 — Gate 1 Dual OCR Ingestion & Gate 2 U-Bot Financial Copilot (13.0s – 22.0s | Beats 27–44)
 */
window.SCENE_03_INGEST_UBOT = function (tl, fx) {
  const t0 = 13.0;
  const rand = fx.mulberry32(2026);

  // Stage entrance
  tl.fromTo(
    "#s03-stage",
    { scale: 0.94, opacity: 0 },
    { scale: 1.0, opacity: 1, duration: 0.45, ease: "snapOut" },
    t0
  );

  fx.maskReveal(tl, ["#s03-header", "#s03-preset-bar"], t0 + 0.15, { y: -20, stagger: 0.1, duration: 0.45 });
  fx.maskReveal(tl, ["#s03-gate1-card", "#s03-gate2-card"], t0 + 0.35, { y: 36, stagger: 0.14, duration: 0.6 });

  // Cursor glides to click "Amazon Web Services · $2,500.00 USDC" preset at t = 13.6s
  fx.cursorMoveAndClick(tl, "#s03-cursor", "#s03-ripple", "#s03-aws-btn", t0 + 0.6, {
    fromX: 1520,
    fromY: 420,
    toX: 1260,
    toY: 98,
    moveDur: 0.65
  });

  // Gate 1 OCR Laser Scan sweeps down the AWS Invoice Card
  tl.fromTo(
    "#s03-ocr-laser",
    { y: 0, opacity: 0 },
    { y: 270, opacity: 0.95, duration: 1.6, ease: "dramaticInOut", immediateRender: false },
    t0 + 1.45
  ).to("#s03-ocr-laser", { opacity: 0, duration: 0.35, immediateRender: false }, t0 + 3.05);

  // Extracted OCR fields pop in sequentially
  fx.maskReveal(tl, ["#s03-field-vendor", "#s03-field-inv", "#s03-field-amt", "#s03-field-wallet"], t0 + 1.7, {
    y: 18,
    stagger: 0.16,
    duration: 0.45
  });

  // Gate 2 U-Bot 32-Bar Neural Voice Equalizer deterministic oscillation across 14.5s – 21.5s
  const bars = document.querySelectorAll(".s03-wave-bar");
  bars.forEach(function (bar, idx) {
    const p1 = 0.25 + rand() * 0.75;
    const p2 = 0.2 + rand() * 0.8;
    const p3 = 0.3 + rand() * 0.7;
    const p4 = 0.25 + rand() * 0.75;
    tl.fromTo(
      bar,
      { scaleY: 0.18 },
      { scaleY: p1, duration: 1.4, ease: "sine.inOut" },
      t0 + 1.4 + (idx % 6) * 0.04
    )
      .to(bar, { scaleY: p2, duration: 1.6, ease: "sine.inOut", immediateRender: false }, t0 + 2.9)
      .to(bar, { scaleY: p3, duration: 1.6, ease: "sine.inOut", immediateRender: false }, t0 + 4.5)
      .to(bar, { scaleY: p4, duration: 1.8, ease: "sine.inOut", immediateRender: false }, t0 + 6.1);
  });

  // Tokenomist Unlock Telemetry + U-Bot transcript reveal
  fx.maskReveal(tl, ["#s03-tokenomist-box", "#s03-ubot-transcript"], t0 + 2.4, {
    y: 22,
    stagger: 0.18,
    duration: 0.55
  });

  // Specular sweep across Verified EVM Wallet pill
  fx.lightSweep(tl, "#s03-wallet-sweep", t0 + 4.2, { width: 620, duration: 0.9 });

  // Whip-pan out to Scene 04 at 21.6s
  fx.whipPanOut(tl, "#s03-stage", t0 + 8.6, { toX: -150, duration: 0.38 });
};
