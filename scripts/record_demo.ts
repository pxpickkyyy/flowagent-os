import { chromium, Page } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const TARGET_URL = process.env.DEMO_TARGET_URL || "https://flowagent-os.vercel.app/";
const VIEWPORT = { width: 3840, height: 2160 };

const OUT_DIRS = [
  path.resolve(process.cwd(), "public", "demo"),
  path.resolve(process.cwd(), "video", "public", "demo"),
];

for (const dir of OUT_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
}

const PRIMARY_DIR = OUT_DIRS[0];
const RAW_VIDEO_DIR = path.join(PRIMARY_DIR, "raw_video");
fs.mkdirSync(RAW_VIDEO_DIR, { recursive: true });

export interface TimelineMarker {
  id: string;
  scene: number;
  label: string;
  timestampMs: number;
  videoTimeSec: number;
  cursor?: { x: number; y: number };
  targetBox?: { x: number; y: number; width: number; height: number };
  snapshotFile?: string;
}

export interface TimelineManifest {
  targetUrl: string;
  viewport: { width: number; height: number };
  fps: number;
  durationSec: number;
  recordedAt: string;
  videoFile: string;
  markers: TimelineMarker[];
}

// Cubic-bezier(0.25, 1, 0.5, 1) approximation for smooth synthetic cursor movement
function cubicBezierEaseOut(t: number): number {
  return 1 - Math.pow(1 - t, 3.2);
}

async function injectDemoHelpers(page: Page) {
  await page.evaluate(() => {
    // 1. Scale 1920x1080 design cleanly to 3840x2160 4K UHD
    document.documentElement.style.zoom = "2";

    // 2. Ensure deterministic IDs exist on live deployment elements
    const assignIds = () => {
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const btn of buttons) {
        const txt = btn.textContent || "";
        if (txt.includes("AWS Infrastructure") && !btn.id) btn.id = "preset-aws";
        if (txt.includes("Tornado Cash Router") && !btn.id) btn.id = "preset-tornado";
        if (txt.includes("NodeOps") && !btn.id) btn.id = "preset-nodeops";
        if (txt.includes("Authorize & Settle via Avalanche") && !btn.id) btn.id = "btn-authorize";
        if (txt.includes("Export CSV") && !btn.id) btn.id = "btn-export-csv";
      }
    };
    assignIds();
    const obs = new MutationObserver(assignIds);
    obs.observe(document.body, { childList: true, subtree: true });

    // 3. Inject synthetic studio cursor + click ripple overlay
    if (!document.getElementById("hf-synthetic-cursor")) {
      const cursor = document.createElement("div");
      cursor.id = "hf-synthetic-cursor";
      cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 28px;
        height: 28px;
        pointer-events: none;
        z-index: 999999;
        transform: translate3d(960px, 540px, 0);
        transition: transform 0.04s linear;
        filter: drop-shadow(0 6px 16px rgba(16, 185, 129, 0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.9));
      `;
      cursor.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 3.5L22.5 13.2L14.2 15.6L10.8 23.5L5.5 3.5Z" fill="#F8FAFC" stroke="#10B981" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      `;
      document.body.appendChild(cursor);
    }
  });
}

async function moveCursorSmooth(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs = 650
) {
  const steps = Math.max(12, Math.floor(durationMs / 25));
  for (let i = 1; i <= steps; i++) {
    const progress = cubicBezierEaseOut(i / steps);
    const cx = Math.round(from.x + (to.x - from.x) * progress);
    const cy = Math.round(from.y + (to.y - from.y) * progress);
    await page.mouse.move(cx, cy);
    await page.evaluate(
      ({ x, y }) => {
        const el = document.getElementById("hf-synthetic-cursor");
        if (el) {
          // Since documentElement has zoom=2, CSS fixed coordinates are in 1920x1080 space
          el.style.transform = `translate3d(${x / 2}px, ${y / 2}px, 0)`;
        }
      },
      { x: cx, y: cy }
    );
    await page.waitForTimeout(Math.floor(durationMs / steps));
  }
}

async function triggerClickRipple(page: Page, pos: { x: number; y: number }, color = "#34D399") {
  await page.evaluate(
    ({ x, y, c }) => {
      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: fixed;
        left: ${x / 2 - 24}px;
        top: ${y / 2 - 24}px;
        width: 48px;
        height: 48px;
        border-radius: 9999px;
        border: 3px solid ${c};
        background: ${c}22;
        pointer-events: none;
        z-index: 999998;
        transform: scale(0.3);
        opacity: 1;
        transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease-out;
      `;
      document.body.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = "scale(1.65)";
        ripple.style.opacity = "0";
      });
      setTimeout(() => ripple.remove(), 500);
    },
    { x: pos.x, y: pos.y, c: color }
  );
}

async function showCsvToastOverlay(page: Page, filename: string) {
  await page.evaluate((fname) => {
    const existing = document.getElementById("hf-csv-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "hf-csv-toast";
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 28px;
      z-index: 999995;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: 16px;
      background: rgba(7, 11, 20, 0.94);
      border: 1.5px solid rgba(52, 211, 153, 0.55);
      box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(52, 211, 153, 0.25);
      color: #F8FAFC;
      font-family: monospace;
      font-size: 13px;
      backdrop-filter: blur(16px);
    `;
    toast.innerHTML = `
      <span style="display:inline-flex;width:26px;height:26px;border-radius:999px;background:rgba(52,211,153,0.2);color:#34D399;align-items:center;justify-content:center;font-weight:bold;">✓</span>
      <div>
        <div style="font-weight:600;color:#34D399;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">ERP Reconciliation Downloaded</div>
        <div style="color:#E2E8F0;margin-top:2px;">${fname} • Verified On-Chain</div>
      </div>
    `;
    document.body.appendChild(toast);
  }, filename);
}

async function getElementBox4K(page: Page, selector: string) {
  const loc = page.locator(selector).first();
  const box = await loc.boundingBox();
  if (!box) return { x: 1920, y: 1080, width: 400, height: 120 };
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
}

async function main() {
  console.log(`[Capture] Launching Headless Chromium at 4K UHD (3840x2160) -> ${TARGET_URL}`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    args: ["--window-size=3840,2160", "--force-device-scale-factor=1", "--hide-scrollbars"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: RAW_VIDEO_DIR,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();
  await page.addInitScript("window.__name = (fn) => fn;");
  const startWallMs = Date.now();
  const markers: TimelineMarker[] = [];
  let cursor = { x: 1920, y: 900 };

  const recordMarker = async (
    id: string,
    scene: number,
    label: string,
    videoTimeSec: number,
    targetSelector?: string,
    takeSnapshot = true
  ) => {
    const elapsedMs = Date.now() - startWallMs;
    let targetBox: { x: number; y: number; width: number; height: number } | undefined;
    if (targetSelector) {
      try {
        targetBox = await getElementBox4K(page, targetSelector);
      } catch {
        // ignore
      }
    }
    let snapshotFile: string | undefined;
    if (takeSnapshot) {
      snapshotFile = `demo/snap_${id}.png`;
      const fullSnapPath = path.join(PRIMARY_DIR, `snap_${id}.png`);
      await page.screenshot({ path: fullSnapPath, fullPage: false });
    }
    markers.push({
      id,
      scene,
      label,
      timestampMs: elapsedMs,
      videoTimeSec,
      cursor: { ...cursor },
      targetBox,
      snapshotFile,
    });
    console.log(`  [Marker] Scene ${scene} | ${id} @ ${elapsedMs}ms -> ${label}`);
  };

  // ── SCENE 1: The SME Cross-Border Friction (0:00 – 0:14) ──────────────
  await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 45000 });
  await injectDemoHelpers(page);
  await page.waitForTimeout(1200);

  await recordMarker("scene1_establishing", 1, "Panoramic Establishing Shot & Live Block Counter", 0.0, "header nav");

  // Glide cursor slowly across header badge & hero metrics strip
  const headerBox = await getElementBox4K(page, "header nav");
  const headerTarget = { x: headerBox.x + Math.round(headerBox.width * 0.55), y: headerBox.y + Math.round(headerBox.height * 0.5) };
  await moveCursorSmooth(page, cursor, headerTarget, 900);
  cursor = headerTarget;
  await page.waitForTimeout(800);

  // Scroll slightly to center the hero metric strip (< 2.0s Finality, 97.8% Fee Elimination, 34ms Sanctions Halt)
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
  await page.waitForTimeout(900);
  await recordMarker("scene1_hero_metrics", 1, "Hero Metrics Strip (< 2.0s Finality, 97.8% Fee Elimination)", 6.5);

  // ── SCENE 2: Dual Ingestion & U-Bot Copilot (0:14 – 0:28) ─────────────
  await page.evaluate(() => {
    document.getElementById("workstation")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await page.waitForTimeout(1000);
  await injectDemoHelpers(page);

  const awsBox = await getElementBox4K(page, "#preset-aws");
  const awsCenter = { x: awsBox.x + Math.round(awsBox.width * 0.45), y: awsBox.y + Math.round(awsBox.height * 0.5) };
  await moveCursorSmooth(page, cursor, awsCenter, 750);
  cursor = awsCenter;
  await triggerClickRipple(page, cursor, "#34D399");
  await page.locator("#preset-aws").first().click();
  await page.waitForTimeout(600);

  await recordMarker("scene2_preset_aws", 2, "Clicked AWS Infrastructure ($2,500.00 USDC • Clean)", 14.0, "#preset-aws");

  // Move focus down to Card 02: U-Bot Financial Copilot
  await page.evaluate(() => window.scrollBy({ top: 210, behavior: "smooth" }));
  await page.waitForTimeout(850);
  await recordMarker("scene2_ubot_copilot", 2, "U-Bot Financial Copilot Populated (AWS Cloud Infrastructure Corp)", 20.5);

  // ── SCENE 3: The Arbitrage Race (0:28 – 0:42) ─────────────────────────
  await page.evaluate(() => {
    document.getElementById("routing")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await page.waitForTimeout(950);
  const routingBox = await getElementBox4K(page, "#routing");
  const routingTarget = { x: routingBox.x + Math.round(routingBox.width * 0.65), y: routingBox.y + Math.round(routingBox.height * 0.55) };
  await moveCursorSmooth(page, cursor, routingTarget, 700);
  cursor = routingTarget;
  await recordMarker("scene3_arbitrage_race", 3, "Liquidity Routing & Settlement Benchmark ($112.50 SWIFT vs $2.50 Avalanche)", 28.0, "#routing");

  // ── SCENE 4: Sub-2-Second On-Chain Settlement (0:42 – 0:58) ───────────
  await page.evaluate(() => {
    document.getElementById("btn-authorize")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await page.waitForTimeout(850);

  const authBox = await getElementBox4K(page, "#btn-authorize");
  const authCenter = { x: authBox.x + Math.round(authBox.width * 0.5), y: authBox.y + Math.round(authBox.height * 0.5) };
  await moveCursorSmooth(page, cursor, authCenter, 700);
  cursor = authCenter;
  await recordMarker("scene4_before_authorize", 4, "Cursor on Authorize & Settle via Avalanche", 42.0, "#btn-authorize");

  await triggerClickRipple(page, cursor, "#34D399");
  await page.locator("#btn-authorize").first().click();
  await page.waitForTimeout(220);

  await recordMarker("scene4_settling", 4, "State SETTLING: Broadcasting to Avalanche Fuji Consensus...", 45.0);

  // Wait for settlement completion (< 1.2s)
  await page.waitForTimeout(1100);
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: "smooth" }));
  await page.waitForTimeout(600);
  await injectDemoHelpers(page);

  await recordMarker("scene4_settled", 4, "State SETTLED: Payment Authorized & Settlement Dispatched", 48.5, "#btn-export-csv");

  // Click Export CSV & show browser download toast for Reconciliation_INV-2026-901.csv
  const csvBox = await getElementBox4K(page, "#btn-export-csv");
  const csvCenter = { x: csvBox.x + Math.round(csvBox.width * 0.5), y: csvBox.y + Math.round(csvBox.height * 0.5) };
  await moveCursorSmooth(page, cursor, csvCenter, 650);
  cursor = csvCenter;
  await triggerClickRipple(page, cursor, "#38BDF8");
  await page.locator("#btn-export-csv").first().click();
  await showCsvToastOverlay(page, "Reconciliation_INV-2026-901.csv");
  await page.waitForTimeout(900);

  await recordMarker("scene4_csv_exported", 4, "Exported Reconciliation_INV-2026-901.csv", 53.0, "#btn-export-csv");

  // Remove toast before Scene 5
  await page.evaluate(() => document.getElementById("hf-csv-toast")?.remove());

  // ── SCENE 5: Deterministic Compliance Guard (0:58 – 1:12) ─────────────
  await page.evaluate(() => {
    document.getElementById("workstation")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await page.waitForTimeout(900);
  await injectDemoHelpers(page);

  const tornadoBox = await getElementBox4K(page, "#preset-tornado");
  const tornadoCenter = { x: tornadoBox.x + Math.round(tornadoBox.width * 0.45), y: tornadoBox.y + Math.round(tornadoBox.height * 0.5) };
  await moveCursorSmooth(page, cursor, tornadoCenter, 750);
  cursor = tornadoCenter;
  await triggerClickRipple(page, cursor, "#FB7185");
  await page.locator("#preset-tornado").first().click();
  await page.waitForTimeout(750);

  await recordMarker("scene5_ofac_selected", 5, "Selected Tornado Cash Router ($5,000.00 USDC • OFAC Flag)", 58.0, "#preset-tornado");

  await page.evaluate(() => window.scrollBy({ top: 260, behavior: "smooth" }));
  await page.waitForTimeout(850);
  await recordMarker("scene5_ofac_terminated", 5, "Transaction Terminated: OFAC Sanctions Flag in 34ms (0 Gas)", 63.5);

  // ── SCENE 6: Outro & Architectural Moat (1:12 – 1:20) ─────────────────
  // Restore clean state and zoom out to full workstation view
  await page.locator("#preset-aws").first().click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(1000);
  await recordMarker("scene6_outro_full", 6, "Full-Screen FlowAgent OS Workstation Outro", 72.0);

  const videoObj = page.video();
  await context.close();
  await browser.close();

  if (videoObj) {
    const rawWebmPath = await videoObj.path();
    const mp4Path = path.join(PRIMARY_DIR, "browser_session.mp4");
    console.log(`[Capture] Transcoding raw WebM capture to high-bitrate MP4: ${mp4Path}`);
    execSync(
      `ffmpeg -y -i "${rawWebmPath}" -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p "${mp4Path}"`,
      { stdio: "ignore" }
    );
  }

  const timelineManifest: TimelineManifest = {
    targetUrl: TARGET_URL,
    viewport: VIEWPORT,
    fps: 60,
    durationSec: 80,
    recordedAt: new Date().toISOString(),
    videoFile: "demo/browser_session.mp4",
    markers,
  };

  const rootTimelinePath = path.resolve(process.cwd(), "timeline.json");
  fs.writeFileSync(rootTimelinePath, JSON.stringify(timelineManifest, null, 2));
  fs.writeFileSync(path.join(PRIMARY_DIR, "timeline.json"), JSON.stringify(timelineManifest, null, 2));

  // Mirror all captured files to video/public/demo
  for (const file of fs.readdirSync(PRIMARY_DIR)) {
    const srcPath = path.join(PRIMARY_DIR, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, path.join(OUT_DIRS[1], file));
    }
  }

  console.log(`[Capture] Saved timeline.json (${markers.length} markers) and 4K snapshots to public/demo & video/public/demo!`);
}

main().catch((err) => {
  console.error("[Capture] Fatal error:", err);
  process.exit(1);
});
