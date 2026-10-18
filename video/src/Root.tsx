import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import timelineData from "../../timeline.json";

const BEZIER_SMOOTH = Easing.bezier(0.25, 1, 0.5, 1);

interface SceneDefinition {
  scene: number;
  title: string;
  timeLabel: string;
  startFrame: number;
  endFrame: number;
  accentColor: string;
  voFile: string;
  voDelayFrames: number;
  subtitles: { startOffset: number; endOffset: number; text: string }[];
}

const SCENES: SceneDefinition[] = [
  {
    scene: 1,
    title: "SCENE 01 // THE SME CROSS-BORDER FRICTION",
    timeLabel: "0:00 – 0:14",
    startFrame: 0,
    endFrame: 840,
    accentColor: "#38BDF8",
    voFile: "demo/vo_scene_1.mp3",
    voDelayFrames: 18,
    subtitles: [
      {
        startOffset: 15,
        endOffset: 430,
        text: "Every month, global import-export SMEs lose thousands of dollars to correspondent banking friction, paying up to 3.5% in hidden FX spreads and waiting 3 to 5 business days for simple cross-border wires.",
      },
      {
        startOffset: 430,
        endOffset: 825,
        text: "FlowAgent OS transforms this broken accounts payable workflow into an autonomous, non-custodial settlement engine.",
      },
    ],
  },
  {
    scene: 2,
    title: "SCENE 02 // DUAL INGESTION & U-BOT COPILOT",
    timeLabel: "0:14 – 0:28",
    startFrame: 840,
    endFrame: 1680,
    accentColor: "#34D399",
    voFile: "demo/vo_scene_2.mp3",
    voDelayFrames: 18,
    subtitles: [
      {
        startOffset: 15,
        endOffset: 440,
        text: "When commercial invoices arrive—via PDF, OCR, or ERP webhooks—our semantic layer extracts structured invoice schemas instantly,",
      },
      {
        startOffset: 440,
        endOffset: 825,
        text: "syncing directly with our U-Bot Copilot to prepare executive sign-off.",
      },
    ],
  },
  {
    scene: 3,
    title: "SCENE 03 // THE ARBITRAGE RACE",
    timeLabel: "0:28 – 0:42",
    startFrame: 1680,
    endFrame: 2520,
    accentColor: "#34D399",
    voFile: "demo/vo_scene_3.mp3",
    voDelayFrames: 18,
    subtitles: [
      {
        startOffset: 15,
        endOffset: 450,
        text: "Before any fund movement occurs, the deterministic routing core benchmarks the real cost: traditional banking drains $112.50 with three intermediary banks.",
      },
      {
        startOffset: 450,
        endOffset: 825,
        text: "FlowAgent routes over Avalanche C-Chain for just $2.50, capturing 98% in fee savings.",
      },
    ],
  },
  {
    scene: 4,
    title: "SCENE 04 // SUB-2-SECOND ON-CHAIN SETTLEMENT",
    timeLabel: "0:42 – 0:58",
    startFrame: 2520,
    endFrame: 3480,
    accentColor: "#34D399",
    voFile: "demo/vo_scene_4.mp3",
    voDelayFrames: 18,
    subtitles: [
      {
        startOffset: 15,
        endOffset: 460,
        text: "With one executive click, the non-custodial signer broadcasts directly to Avalanche Snowman BFT consensus.",
      },
      {
        startOffset: 460,
        endOffset: 945,
        text: "Irrevocable finality is achieved in milliseconds with full cryptographic verification and instant 1-click CSV reconciliation for local accounting suites like PEAK and FlowAccount.",
      },
    ],
  },
  {
    scene: 5,
    title: "SCENE 05 // DETERMINISTIC COMPLIANCE GUARD",
    timeLabel: "0:58 – 1:12",
    startFrame: 3480,
    endFrame: 4320,
    accentColor: "#FB7185",
    voFile: "demo/vo_scene_5.mp3",
    voDelayFrames: 18,
    subtitles: [
      {
        startOffset: 15,
        endOffset: 380,
        text: "Financial operations demand zero tolerance for AI hallucinations.",
      },
      {
        startOffset: 380,
        endOffset: 825,
        text: "When an invoice targets an OFAC-sanctioned wallet, our Deterministic Compliance Guard terminates execution in under 35 milliseconds—guaranteeing zero funds move and zero gas is lost.",
      },
    ],
  },
  {
    scene: 6,
    title: "SCENE 06 // OUTRO & ARCHITECTURAL MOAT",
    timeLabel: "1:12 – 1:20",
    startFrame: 4320,
    endFrame: 4800,
    accentColor: "#38BDF8",
    voFile: "demo/vo_scene_6.mp3",
    voDelayFrames: 15,
    subtitles: [
      {
        startOffset: 12,
        endOffset: 468,
        text: "AI at the interface. Deterministic code at the core. FlowAgent OS: institutional cross-border finance at the speed of consensus.",
      },
    ],
  },
];

// Motion-tracked UI Highlight Box with 4px Border Pulse
const HighlightBox: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label?: string;
  opacity?: number;
}> = ({ x, y, width, height, color, label, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const pulse = 0.65 + 0.35 * Math.sin((frame / 60) * Math.PI * 3.5);
  const scalePulse = 1 + 0.008 * Math.sin((frame / 60) * Math.PI * 3.5);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        borderRadius: 36,
        border: `4px solid ${color}`,
        boxShadow: `0 0 ${Math.round(48 * pulse)}px ${color}88, inset 0 0 ${Math.round(28 * pulse)}px ${color}33`,
        transform: `scale(${scalePulse})`,
        opacity,
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      {label ? (
        <div
          style={{
            position: "absolute",
            top: -46,
            left: 20,
            background: "#070B14EE",
            border: `2px solid ${color}`,
            color,
            padding: "6px 18px",
            borderRadius: 999,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            boxShadow: `0 8px 24px rgba(0,0,0,0.75)`,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

// Synthetic Cubic-Bezier Cursor & Click Ripple
const SyntheticCursor: React.FC<{
  x: number;
  y: number;
  clicking?: boolean;
  rippleColor?: string;
}> = ({ x, y, clicking = false, rippleColor = "#34D399" }) => {
  const frame = useCurrentFrame();
  const rippleProgress = (frame % 36) / 36;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 90,
        pointerEvents: "none",
      }}
    >
      {clicking && (
        <div
          style={{
            position: "absolute",
            left: -48,
            top: -48,
            width: 96,
            height: 96,
            borderRadius: 9999,
            border: `4px solid ${rippleColor}`,
            background: `${rippleColor}28`,
            transform: `scale(${0.4 + rippleProgress * 1.45})`,
            opacity: 1 - rippleProgress,
          }}
        />
      )}
      <svg
        width="58"
        height="58"
        viewBox="0 0 28 28"
        fill="none"
        style={{
          transform: clicking ? "scale(0.88)" : "scale(1)",
          filter: `drop-shadow(0 12px 24px ${rippleColor}99) drop-shadow(0 4px 8px rgba(0,0,0,0.95))`,
        }}
      >
        <path
          d="M5.5 3.5L22.5 13.2L14.2 15.6L10.8 23.5L5.5 3.5Z"
          fill="#F8FAFC"
          stroke={rippleColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export const FlowAgentDemoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine active scene
  const activeScene =
    SCENES.find((s) => frame >= s.startFrame && frame < s.endFrame) || SCENES[SCENES.length - 1];
  const localFrame = frame - activeScene.startFrame;

  // Select captured 4K plate based on timeline state
  let currentSnapshot = "demo/snap_scene1_establishing.png";
  if (frame < 390) {
    currentSnapshot = "demo/snap_scene1_establishing.png";
  } else if (frame < 840) {
    currentSnapshot = "demo/snap_scene1_hero_metrics.png";
  } else if (frame < 1230) {
    currentSnapshot = "demo/snap_scene2_preset_aws.png";
  } else if (frame < 1680) {
    currentSnapshot = "demo/snap_scene2_ubot_copilot.png";
  } else if (frame < 2520) {
    currentSnapshot = "demo/snap_scene3_arbitrage_race.png";
  } else if (frame < 2700) {
    currentSnapshot = "demo/snap_scene4_before_authorize.png";
  } else if (frame < 2910) {
    currentSnapshot = "demo/snap_scene4_settling.png";
  } else if (frame < 3180) {
    currentSnapshot = "demo/snap_scene4_settled.png";
  } else if (frame < 3480) {
    currentSnapshot = "demo/snap_scene4_csv_exported.png";
  } else if (frame < 3810) {
    currentSnapshot = "demo/snap_scene5_ofac_selected.png";
  } else if (frame < 4320) {
    currentSnapshot = "demo/snap_scene5_ofac_terminated.png";
  } else {
    currentSnapshot = "demo/snap_scene6_outro_full.png";
  }

  // Compute kinetic camera zoom (1.0x to 1.35x) & pan (tx, ty) with cubic-bezier(0.25, 1, 0.5, 1)
  let camScale = 1.0;
  let camX = 0;
  let camY = 0;
  let cursorX = 1920;
  let cursorY = 1080;
  let isClicking = false;
  let clickColor = "#34D399";

  if (activeScene.scene === 1) {
    // Scene 1 (0:00 - 0:14): Panoramic glide across header block counter -> smooth zoom into hero metric strip
    if (localFrame < 390) {
      camScale = interpolate(localFrame, [0, 390], [1.15, 1.24], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(localFrame, [0, 390], [120, -80], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(localFrame, [0, 390], [220, 180], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(localFrame, [0, 390], [1550, 2180], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(localFrame, [0, 390], [120, 115], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    } else {
      const f = localFrame - 390;
      camScale = interpolate(f, [0, 450], [1.18, 1.32], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(f, [0, 450], [0, -40], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(f, [0, 450], [-140, -320], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(f, [0, 450], [1220, 2560], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(f, [0, 450], [1560, 1560], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    }
  } else if (activeScene.scene === 2) {
    // Scene 2 (0:14 - 0:28): Pan to Card 1 (Commercial Invoice Ingestion), click #preset-aws, zoom to Card 2 (U-Bot Copilot)
    if (localFrame < 390) {
      camScale = interpolate(localFrame, [0, 390], [1.16, 1.28], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(localFrame, [0, 390], [320, 380], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(localFrame, [0, 390], [80, 140], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(localFrame, [0, 180], [1750, 1180], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(localFrame, [0, 180], [920, 740], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      isClicking = localFrame >= 165 && localFrame <= 235;
      clickColor = "#34D399";
    } else {
      const f = localFrame - 390;
      camScale = interpolate(f, [0, 450], [1.22, 1.34], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(f, [0, 450], [340, 390], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(f, [0, 450], [-120, -240], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(f, [0, 450], [1180, 1340], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(f, [0, 450], [950, 1280], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    }
  } else if (activeScene.scene === 3) {
    // Scene 3 (0:28 - 0:42): Shift to Card 3/4 (Liquidity Routing & Settlement Benchmark)
    camScale = interpolate(localFrame, [0, 840], [1.18, 1.32], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    camX = interpolate(localFrame, [0, 840], [-220, -310], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    camY = interpolate(localFrame, [0, 840], [-20, -110], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    cursorX = interpolate(localFrame, [0, 420, 840], [2100, 2360, 2420], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    cursorY = interpolate(localFrame, [0, 420, 840], [960, 1140, 1360], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
  } else if (activeScene.scene === 4) {
    // Scene 4 (0:42 - 0:58): Authorize button -> SETTLING -> SETTLED -> Receipt strip -> Export CSV toast
    if (localFrame < 390) {
      camScale = interpolate(localFrame, [0, 390], [1.18, 1.28], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(localFrame, [0, 390], [280, 340], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(localFrame, [0, 390], [-180, -240], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(localFrame, [0, 150], [1800, 1240], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(localFrame, [0, 150], [1150, 1380], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      isClicking = localFrame >= 145 && localFrame <= 210;
      clickColor = "#34D399";
    } else {
      const f = localFrame - 390;
      camScale = interpolate(f, [0, 570], [1.22, 1.33], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(f, [0, 570], [-240, -320], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(f, [0, 570], [-220, -310], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(f, [0, 240], [1400, 2780], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(f, [0, 240], [1380, 1540], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      isClicking = f >= 230 && f <= 300;
      clickColor = "#38BDF8";
    }
  } else if (activeScene.scene === 5) {
    // Scene 5 (0:58 - 1:12): Select Tornado Cash Router (#preset-tornado) -> OFAC Halt Crimson Container
    if (localFrame < 330) {
      camScale = interpolate(localFrame, [0, 330], [1.16, 1.26], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(localFrame, [0, 330], [280, 350], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(localFrame, [0, 330], [120, 160], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(localFrame, [0, 140], [2100, 1180], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(localFrame, [0, 140], [1100, 860], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      isClicking = localFrame >= 135 && localFrame <= 205;
      clickColor = "#FB7185";
    } else {
      const f = localFrame - 330;
      camScale = interpolate(f, [0, 510], [1.20, 1.32], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camX = interpolate(f, [0, 510], [-210, -290], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      camY = interpolate(f, [0, 510], [-140, -260], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorX = interpolate(f, [0, 510], [1400, 2320], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
      cursorY = interpolate(f, [0, 510], [1050, 1420], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    }
  } else {
    // Scene 6 (1:12 - 1:20): Smooth zoom out to 100% full-screen workstation + Architectural Moat overlay
    camScale = interpolate(localFrame, [0, 240], [1.18, 1.0], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    camX = interpolate(localFrame, [0, 240], [-120, 0], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    camY = interpolate(localFrame, [0, 240], [-90, 0], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" });
    cursorX = 1920;
    cursorY = 1080;
  }

  // Active subtitle for current frame
  const activeSub = activeScene.subtitles.find(
    (s) => localFrame >= s.startOffset && localFrame <= s.endOffset
  );

  // Dynamic live block height counter ticking every 4s
  const liveBlockNumber = 59490095 + Math.floor(frame / 240);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#070B14",
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        color: "#F8FAFC",
        overflow: "hidden",
      }}
    >
      {/* ── MASTER AUDIO BUS (Ambient Pad + ElevenLabs Narration + Studio SFX) ── */}
      <Audio src={staticFile("demo/bgm_ambient.mp3")} volume={0.35} />

      {SCENES.map((s) => (
        <Sequence key={`vo-${s.scene}`} from={s.startFrame + s.voDelayFrames} durationInFrames={s.endFrame - s.startFrame}>
          <Audio src={staticFile(s.voFile)} volume={1.0} />
        </Sequence>
      ))}

      {/* Scene Transition Sub-Bass Risers */}
      {[0, 840, 1680, 2520, 3480, 4320].map((transitionFrame) => (
        <Sequence key={`riser-${transitionFrame}`} from={Math.max(0, transitionFrame - 15)} durationInFrames={75}>
          <Audio src={staticFile("demo/sfx_riser.mp3")} volume={0.55} />
        </Sequence>
      ))}

      {/* Soft UI Clicks on Preset & Button Selections */}
      {[1010, 2670, 3150, 3620].map((clickFrame) => (
        <Sequence key={`click-${clickFrame}`} from={clickFrame} durationInFrames={15}>
          <Audio src={staticFile("demo/sfx_click.mp3")} volume={0.75} />
        </Sequence>
      ))}

      {/* Affirmative Harmonic Ping on Sub-2s On-Chain Settlement Confirmation */}
      <Sequence from={2895} durationInFrames={95}>
        <Audio src={staticFile("demo/sfx_confirm.mp3")} volume={0.85} />
      </Sequence>

      {/* Low Alert Pulse on OFAC Violation */}
      <Sequence from={3635} durationInFrames={70}>
        <Audio src={staticFile("demo/sfx_alert.mp3")} volume={0.85} />
      </Sequence>

      {/* ── AMBIENT RADIAL GLOW BACKDROP ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            activeScene.scene === 5
              ? "radial-gradient(circle at 50% 35%, rgba(251, 113, 133, 0.16), rgba(7, 11, 20, 0.98) 70%)"
              : "radial-gradient(circle at 50% 30%, rgba(52, 211, 153, 0.12), rgba(56, 189, 248, 0.08) 40%, rgba(7, 11, 20, 0.98) 75%)",
        }}
      />

      {/* ── HYPERFRAMES KINETIC CAMERA RIG (3840x2160 4K Canvas) ── */}
      <div
        style={{
          position: "absolute",
          width: 3840,
          height: 2160,
          transform: `translate3d(${camX}px, ${camY}px, 0) scale(${camScale})`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile(currentSnapshot)}
          style={{
            width: 3840,
            height: 2160,
            objectFit: "cover",
          }}
        />

        {/* Scene-Specific Motion-Tracked Highlight Boxes (4px Border Pulse) */}
        {activeScene.scene === 1 && localFrame < 390 && (
          <HighlightBox
            x={1406}
            y={36}
            width={1027}
            height={120}
            color="#38BDF8"
            label={`Avalanche Fuji (chainId: 43113) • Block #${liveBlockNumber}`}
          />
        )}

        {activeScene.scene === 1 && localFrame >= 390 && (
          <HighlightBox
            x={710}
            y={1480}
            width={2420}
            height={360}
            color="#34D399"
            label="< 2.0s Finality • 97.8% Fee Elimination • 100% Deterministic Compliance"
          />
        )}

        {activeScene.scene === 2 && localFrame < 390 && (
          <HighlightBox
            x={760}
            y={1143}
            width={873}
            height={162}
            color="#34D399"
            label="Preset #preset-aws • $2,500.00 USDC • Clean"
          />
        )}

        {activeScene.scene === 2 && localFrame >= 390 && (
          <HighlightBox
            x={730}
            y={1180}
            width={935}
            height={880}
            color="#38BDF8"
            label="Card 02 // U-Bot Financial Copilot Synced"
          />
        )}

        {activeScene.scene === 3 && (
          <>
            <HighlightBox
              x={1780}
              y={985}
              width={1315}
              height={345}
              color="#FB7185"
              label="Traditional SWIFT Wire • $112.50 Fee • 3–5 Business Days"
            />
            <HighlightBox
              x={1780}
              y={1375}
              width={1315}
              height={360}
              color="#34D399"
              label="Avalanche C-Chain • $2.50 Fee • 0.09s Finality"
            />
          </>
        )}

        {activeScene.scene === 4 && localFrame < 390 && (
          <HighlightBox
            x={760}
            y={1124}
            width={873}
            height={136}
            color="#34D399"
            label="#btn-authorize • Non-Custodial ECDSA Signer"
          />
        )}

        {activeScene.scene === 4 && localFrame >= 390 && (
          <HighlightBox
            x={1737}
            y={840}
            width={1399}
            height={260}
            color="#34D399"
            label="Settled On-Chain • TxHash 0xb17a... • Latency: 114ms"
          />
        )}

        {activeScene.scene === 5 && (
          <HighlightBox
            x={1737}
            y={760}
            width={1399}
            height={420}
            color="#FB7185"
            label="Step 2: Compliance Halt • OFAC Sanctions Blacklist Match (34ms)"
          />
        )}

        {/* Synthetic Smooth Cubic-Bezier Cursor */}
        {activeScene.scene < 6 && (
          <SyntheticCursor x={cursorX} y={cursorY} clicking={isClicking} rippleColor={clickColor} />
        )}
      </div>

      {/* ── SCENE-SPECIFIC KINETIC FLOATING CALLOUTS ── */}

      {/* Scene 1: Hero Metric Strip Callout Pills */}
      {activeScene.scene === 1 && localFrame >= 360 && (
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 36,
            opacity: interpolate(localFrame, [360, 410, 790, 835], [0, 1, 1, 0], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(localFrame, [360, 410], [28, 0], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" })}px)`,
            zIndex: 55,
          }}
        >
          {[
            { label: "< 2.0s Finality", sub: "Snowman BFT Consensus", color: "#34D399" },
            { label: "97.8% Fee Elimination", sub: "$2.50 vs $112.50 SWIFT", color: "#34D399" },
            { label: "100% Deterministic Compliance", sub: "34ms Pre-Sign OFAC Guard", color: "#38BDF8" },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                background: "rgba(10, 15, 29, 0.92)",
                border: `2px solid ${metric.color}88`,
                boxShadow: `0 24px 60px rgba(0,0,0,0.85), 0 0 36px ${metric.color}28`,
                borderRadius: 28,
                padding: "22px 38px",
                backdropFilter: "blur(24px)",
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 800, color: metric.color, letterSpacing: "-0.02em" }}>
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#94A3B8",
                  marginTop: 6,
                }}
              >
                {metric.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scene 2: U-Bot Copilot Extracted Schema Callout */}
      {activeScene.scene === 2 && localFrame >= 360 && (
        <div
          style={{
            position: "absolute",
            top: 200,
            right: 140,
            width: 1120,
            background: "rgba(10, 15, 29, 0.94)",
            border: "3px solid rgba(56, 189, 248, 0.65)",
            borderRadius: 32,
            padding: "34px 42px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(56, 189, 248, 0.25)",
            opacity: interpolate(localFrame, [360, 410, 790, 835], [0, 1, 1, 0], { extrapolateRight: "clamp" }),
            transform: `translateX(${interpolate(localFrame, [360, 410], [60, 0], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" })}px)`,
            zIndex: 55,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              color: "#38BDF8",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            ● U-Bot Financial Copilot // Schema Synced
          </div>
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 18, color: "#94A3B8" }}>Vendor</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#F8FAFC", marginTop: 4 }}>
                AWS Cloud Infrastructure Corp
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, color: "#94A3B8" }}>Gross Payable</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "#34D399", marginTop: 4 }}>$2,500.00 USDC</div>
            </div>
            <div style={{ gridSpan: "all" as any }}>
              <div style={{ fontSize: 18, color: "#94A3B8" }}>Recipient Checksum</div>
              <div
                style={{
                  fontSize: 24,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#E2E8F0",
                  marginTop: 4,
                }}
              >
                0x7099...79C8 (Verified Clean • INV-2026-901)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scene 3: Kinetic Arbitrage Savings Tag (+$110.00 Net Savings (97.8%)) */}
      {activeScene.scene === 3 && (
        <div
          style={{
            position: "absolute",
            top: 190,
            left: 140,
            background: "linear-gradient(135deg, rgba(6, 78, 59, 0.96), rgba(10, 15, 29, 0.96))",
            border: "4px solid #34D399",
            borderRadius: 36,
            padding: "32px 48px",
            boxShadow: "0 30px 90px rgba(0,0,0,0.9), 0 0 65px rgba(52, 211, 153, 0.45)",
            opacity: interpolate(localFrame, [45, 95, 790, 835], [0, 1, 1, 0], { extrapolateRight: "clamp" }),
            transform: `scale(${interpolate(localFrame, [45, 95], [0.86, 1], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" })})`,
            zIndex: 55,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              color: "#A7F3D0",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            DETERMINISTIC RAIL ARBITRAGE
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#34D399",
              letterSpacing: "-0.03em",
              marginTop: 8,
            }}
          >
            +$110.00 Net Savings (97.8%)
          </div>
          <div
            style={{
              display: "flex",
              gap: 36,
              marginTop: 16,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 22,
            }}
          >
            <span style={{ color: "#FB7185", textDecoration: "line-through" }}>
              SWIFT Wire: $112.50 (3–5 Days)
            </span>
            <span style={{ color: "#34D399", fontWeight: 700 }}>
              Avalanche C-Chain: $2.50 (0.09s Finality)
            </span>
          </div>
        </div>
      )}

      {/* Scene 4: Live Settlement State & Receipt Strip + CSV Reconciliation Toast */}
      {activeScene.scene === 4 && (
        <>
          <div
            style={{
              position: "absolute",
              top: 180,
              left: 140,
              width: 1280,
              background: "rgba(10, 15, 29, 0.95)",
              border: `3px solid ${localFrame < 370 ? "#38BDF8" : "#34D399"}`,
              borderRadius: 32,
              padding: "30px 42px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(52, 211, 153, 0.3)",
              opacity: interpolate(localFrame, [150, 185, 910, 955], [0, 1, 1, 0], { extrapolateRight: "clamp" }),
              zIndex: 55,
            }}
          >
            {localFrame < 370 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    border: "5px solid #38BDF8",
                    borderTopColor: "transparent",
                    transform: `rotate(${localFrame * 12}deg)`,
                  }}
                />
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: "#38BDF8" }}>
                    STATE: SETTLING // SNOWMAN BFT
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: "#F8FAFC", marginTop: 4 }}>
                    Broadcasting to Avalanche Fuji Consensus...
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      background: "#34D399",
                      color: "#022014",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, color: "#34D399" }}>
                      STATE: SETTLED // IRREVOCABLE FINALITY
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: "#F8FAFC" }}>
                      Payment Authorized & Settlement Dispatched
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    gap: 34,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 22,
                    color: "#E2E8F0",
                  }}
                >
                  <span>
                    TxHash: <strong style={{ color: "#34D399" }}>0xb17a...e059ba7</strong>
                  </span>
                  <span>
                    Latency: <strong style={{ color: "#34D399" }}>114ms</strong>
                  </span>
                  <span>
                    Block: <strong style={{ color: "#38BDF8" }}>#59490095</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {localFrame >= 610 && (
            <div
              style={{
                position: "absolute",
                top: 180,
                right: 140,
                background: "rgba(7, 11, 20, 0.96)",
                border: "3px solid #38BDF8",
                borderRadius: 28,
                padding: "26px 38px",
                boxShadow: "0 24px 70px rgba(0,0,0,0.9), 0 0 40px rgba(56, 189, 248, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: 22,
                opacity: interpolate(localFrame, [610, 645, 910, 955], [0, 1, 1, 0], { extrapolateRight: "clamp" }),
                transform: `translateY(${interpolate(localFrame, [610, 645], [-24, 0], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" })}px)`,
                zIndex: 60,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "rgba(56, 189, 248, 0.18)",
                  border: "2px solid #38BDF8",
                  color: "#38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                ⇩
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 18,
                    color: "#38BDF8",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  1-Click ERP Reconciliation Exported
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 25,
                    fontWeight: 700,
                    color: "#F8FAFC",
                    marginTop: 4,
                  }}
                >
                  Reconciliation_INV-2026-901.csv
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Scene 5: High-Contrast Crimson OFAC Halt Banner */}
      {activeScene.scene === 5 && localFrame >= 165 && (
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 140,
            width: 1520,
            background: "linear-gradient(135deg, rgba(76, 5, 25, 0.96), rgba(15, 10, 20, 0.96))",
            border: "4px solid #FB7185",
            borderRadius: 34,
            padding: "32px 44px",
            boxShadow: "0 30px 90px rgba(0,0,0,0.95), 0 0 70px rgba(251, 113, 133, 0.45)",
            opacity: interpolate(localFrame, [165, 205, 790, 835], [0, 1, 1, 0], { extrapolateRight: "clamp" }),
            transform: `scale(${interpolate(localFrame, [165, 205], [0.92, 1], { easing: BEZIER_SMOOTH, extrapolateRight: "clamp" })})`,
            zIndex: 60,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "rgba(251, 113, 133, 0.22)",
                border: "3px solid #FB7185",
                color: "#FB7185",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              ⚠
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 20,
                  color: "#FDA4AF",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                STEP 2: COMPLIANCE HALT // DETERMINISTIC GUARD
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#FFF1F2", marginTop: 4 }}>
                Transaction Terminated: OFAC Sanctions Flag
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 23,
              color: "#FFE4E6",
            }}
          >
            Blacklist matched in <strong>34ms</strong> • <strong>0 gas incurred</strong> • Target:{" "}
            <span style={{ color: "#FB7185" }}>0x8576...353c (Tornado Cash Router)</span>
          </div>
        </div>
      )}

      {/* Scene 6: Full-Screen Architectural Moat Outro Overlay */}
      {activeScene.scene === 6 && (
        <AbsoluteFill
          style={{
            background: "radial-gradient(circle at 50% 45%, rgba(7, 11, 20, 0.78), rgba(7, 11, 20, 0.94) 75%)",
            backdropFilter: "blur(14px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: interpolate(localFrame, [0, 45], [0, 1], { extrapolateRight: "clamp" }),
            zIndex: 65,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 24,
              color: "#34D399",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              padding: "12px 32px",
              borderRadius: 999,
              border: "2px solid rgba(52, 211, 153, 0.45)",
              background: "rgba(52, 211, 153, 0.08)",
            }}
          >
            AI AT THE INTERFACE • DETERMINISTIC CODE AT THE CORE
          </div>

          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: "#F8FAFC",
              letterSpacing: "-0.04em",
              marginTop: 34,
              textAlign: "center",
            }}
          >
            FlowAgent OS
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 500,
              color: "#94A3B8",
              marginTop: 12,
              letterSpacing: "-0.01em",
            }}
          >
            Autonomous Accounts Payable Middleware
          </div>

          {/* Partner Badges */}
          <div style={{ display: "flex", gap: 28, marginTop: 54 }}>
            {[
              { name: "Avalanche Fuji", color: "#34D399" },
              { name: "ElevenLabs", color: "#38BDF8" },
              { name: "U-Bot Copilot", color: "#38BDF8" },
              { name: "Tokenomist", color: "#34D399" },
            ].map((partner) => (
              <div
                key={partner.name}
                style={{
                  padding: "18px 36px",
                  borderRadius: 24,
                  background: "rgba(15, 23, 42, 0.88)",
                  border: `2px solid ${partner.color}66`,
                  color: "#F8FAFC",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 600,
                  boxShadow: `0 16px 40px rgba(0,0,0,0.65), 0 0 24px ${partner.color}22`,
                }}
              >
                <span style={{ color: partner.color, marginRight: 12 }}>●</span>
                {partner.name}
              </div>
            ))}
          </div>

          {/* Live Deployment Link */}
          <div
            style={{
              marginTop: 58,
              padding: "22px 52px",
              borderRadius: 999,
              background: "linear-gradient(90deg, rgba(52, 211, 153, 0.16), rgba(56, 189, 248, 0.16))",
              border: "3px solid #34D399",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 34,
              fontWeight: 700,
              color: "#34D399",
              boxShadow: "0 0 60px rgba(52, 211, 153, 0.35)",
            }}
          >
            https://flowagent-os.vercel.app/
          </div>
        </AbsoluteFill>
      )}

      {/* ── TOP TELEMETRY HUD BAR ── */}
      <div
        style={{
          position: "absolute",
          top: 44,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 75,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            background: "rgba(7, 11, 20, 0.88)",
            border: `2px solid ${activeScene.accentColor}66`,
            padding: "14px 28px",
            borderRadius: 999,
            backdropFilter: "blur(16px)",
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: activeScene.accentColor,
              boxShadow: `0 0 16px ${activeScene.accentColor}`,
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              fontWeight: 700,
              color: "#F8FAFC",
              letterSpacing: "0.08em",
            }}
          >
            {activeScene.title}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              color: activeScene.accentColor,
              paddingLeft: 12,
              borderLeft: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {activeScene.timeLabel}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            background: "rgba(7, 11, 20, 0.88)",
            border: "2px solid rgba(255,255,255,0.12)",
            padding: "14px 28px",
            borderRadius: 999,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 19,
            color: "#94A3B8",
            backdropFilter: "blur(16px)",
          }}
        >
          <span>
            TARGET: <strong style={{ color: "#F8FAFC" }}>{timelineData.targetUrl}</strong>
          </span>
          <span>•</span>
          <span>
            CHAIN: <strong style={{ color: "#34D399" }}>43113 (FUJI)</strong>
          </span>
          <span>•</span>
          <span>
            BLOCK: <strong style={{ color: "#38BDF8" }}>#{liveBlockNumber}</strong>
          </span>
        </div>
      </div>

      {/* ── LOWER-THIRD KINETIC SUBTITLE & VOICEOVER BAR ── */}
      {activeSub && (
        <div
          style={{
            position: "absolute",
            bottom: 58,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 80,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              maxWidth: 2880,
              background: "rgba(7, 11, 20, 0.92)",
              border: `2px solid ${activeScene.accentColor}77`,
              borderRadius: 28,
              padding: "24px 48px",
              boxShadow: "0 24px 70px rgba(0,0,0,0.92)",
              backdropFilter: "blur(24px)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "#F8FAFC",
                lineHeight: 1.42,
                letterSpacing: "-0.01em",
              }}
            >
              {activeSub.text}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FlowAgentDemo"
        component={FlowAgentDemoComposition}
        durationInFrames={4800}
        fps={60}
        width={3840}
        height={2160}
      />
    </>
  );
};
