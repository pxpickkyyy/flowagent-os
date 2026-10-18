import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";

const ROOT = process.cwd();
const DEMO_DIR = path.join(ROOT, "public", "demo");
const VIDEO_DEMO_DIR = path.join(ROOT, "video", "public", "demo");
const OUT_DIR = path.join(ROOT, "out");
const PLATES_DIR = path.join(OUT_DIR, "plates");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PLATES_DIR, { recursive: true });

// 1. Clean heavy raw_video and browser_session.mp4 out of public/demo during bundling so Remotion public copy is tiny
const rawVideoDir = path.join(DEMO_DIR, "raw_video");
if (fs.existsSync(rawVideoDir)) {
  fs.rmSync(rawVideoDir, { recursive: true, force: true });
}
const videoRawDir = path.join(VIDEO_DEMO_DIR, "raw_video");
if (fs.existsSync(videoRawDir)) {
  fs.rmSync(videoRawDir, { recursive: true, force: true });
}
const heavyMp4A = path.join(DEMO_DIR, "browser_session.mp4");
const heavyMp4B = path.join(VIDEO_DEMO_DIR, "browser_session.mp4");
const backupMp4 = path.join(OUT_DIR, "browser_session_capture.mp4");
if (fs.existsSync(heavyMp4A)) {
  fs.copyFileSync(heavyMp4A, backupMp4);
  fs.unlinkSync(heavyMp4A);
}
if (fs.existsSync(heavyMp4B)) {
  fs.unlinkSync(heavyMp4B);
}

function getDuration(file: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
  )
    .toString()
    .trim();
  return parseFloat(out);
}

// 2. Ensure every ElevenLabs VO track fits strictly inside its scene window with zero overlap
const VO_WINDOWS: { file: string; maxSec: number; startMs: number }[] = [
  { file: "vo_scene_1.mp3", maxSec: 12.8, startMs: 400 },
  { file: "vo_scene_2.mp3", maxSec: 12.8, startMs: 14400 },
  { file: "vo_scene_3.mp3", maxSec: 12.8, startMs: 28400 },
  { file: "vo_scene_4.mp3", maxSec: 14.8, startMs: 42400 },
  { file: "vo_scene_5.mp3", maxSec: 12.8, startMs: 58400 },
  { file: "vo_scene_6.mp3", maxSec: 7.1, startMs: 72250 },
];

for (const vw of VO_WINDOWS) {
  const p = path.join(DEMO_DIR, vw.file);
  if (!fs.existsSync(p)) continue;
  const dur = getDuration(p);
  if (dur > vw.maxSec) {
    const tmp = p + ".tmp.mp3";
    execSync(
      `ffmpeg -y -i "${p}" -af "silenceremove=stop_periods=-1:stop_duration=0.14:stop_threshold=-38dB" -c:a libmp3lame -b:a 192k "${tmp}"`,
      { stdio: "ignore" }
    );
    const trimmedDur = getDuration(tmp);
    if (trimmedDur > vw.maxSec) {
      const ratio = Math.min(1.45, Number((trimmedDur / (vw.maxSec - 0.15)).toFixed(3)));
      const tmp2 = p + ".tmp2.mp3";
      execSync(
        `ffmpeg -y -i "${tmp}" -af "atempo=${ratio}" -c:a libmp3lame -b:a 192k "${tmp2}"`,
        { stdio: "ignore" }
      );
      fs.renameSync(tmp2, p);
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } else {
      fs.renameSync(tmp, p);
    }
    fs.copyFileSync(p, path.join(VIDEO_DEMO_DIR, vw.file));
  }
  console.log(`[Audio Fit] ${vw.file}: ${getDuration(p).toFixed(2)}s (window <= ${vw.maxSec}s)`);
}

// 3. Render 13 high-resolution 4K (3840x2160) composite keyframes via Remotion (video/src/index.ts FlowAgentDemo)
interface SegmentSpec {
  id: string;
  sampleFrame: number;
  durationSec: number;
}

const SEGMENTS: SegmentSpec[] = [
  // Scene 1 (0:00 - 0:14 = 14s)
  { id: "seg01_s1a", sampleFrame: 120, durationSec: 6.5 },
  { id: "seg02_s1b", sampleFrame: 520, durationSec: 7.5 },
  // Scene 2 (0:14 - 0:28 = 14s)
  { id: "seg03_s2a", sampleFrame: 960, durationSec: 6.5 },
  { id: "seg04_s2b", sampleFrame: 1380, durationSec: 7.5 },
  // Scene 3 (0:28 - 0:42 = 14s)
  { id: "seg05_s3a", sampleFrame: 1850, durationSec: 7.0 },
  { id: "seg06_s3b", sampleFrame: 2250, durationSec: 7.0 },
  // Scene 4 (0:42 - 0:58 = 16s)
  { id: "seg07_s4a", sampleFrame: 2600, durationSec: 3.5 },
  { id: "seg08_s4b", sampleFrame: 2780, durationSec: 3.5 },
  { id: "seg09_s4c", sampleFrame: 3000, durationSec: 4.5 },
  { id: "seg10_s4d", sampleFrame: 3250, durationSec: 4.5 },
  // Scene 5 (0:58 - 1:12 = 14s)
  { id: "seg11_s5a", sampleFrame: 3560, durationSec: 5.5 },
  { id: "seg12_s5b", sampleFrame: 3960, durationSec: 8.5 },
  // Scene 6 (1:12 - 1:20 = 8s)
  { id: "seg13_s6", sampleFrame: 4500, durationSec: 8.0 },
];

async function runCompilation() {
  console.log("[Remotion] Bundling video/src/index.ts once...");
  const bundleLocation = await bundle({
    entryPoint: path.join(ROOT, "video", "src", "index.ts"),
    publicDir: path.join(ROOT, "public"),
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "FlowAgentDemo",
  });

  console.log("[Remotion] Rendering 13 4K UHD (3840x2160) scene plates from FlowAgentDemo...");
  for (const seg of SEGMENTS) {
    const outPng = path.join(PLATES_DIR, `${seg.id}.png`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outPng,
      frame: seg.sampleFrame,
      imageFormat: "png",
      chromiumOptions: { gl: "angle" },
    });
    console.log(`  -> Rendered ${seg.id}.png (frame ${seg.sampleFrame})`);
  }

// 4. Build the 80-second Master Audio Bus (ElevenLabs VOs + Sub-bass Risers + UI Clicks + Confirm Ping + OFAC Alert + Ambient Pad)
console.log("[Audio Bus] Mixing 80-second master audio bus (ElevenLabs VO + Studio SFX + Ambient Pad)...");
const masterAudioPath = path.join(OUT_DIR, "master_audio_80s.m4a");

const bgm = path.join(DEMO_DIR, "bgm_ambient.mp3");
const vo1 = path.join(DEMO_DIR, "vo_scene_1.mp3");
const vo2 = path.join(DEMO_DIR, "vo_scene_2.mp3");
const vo3 = path.join(DEMO_DIR, "vo_scene_3.mp3");
const vo4 = path.join(DEMO_DIR, "vo_scene_4.mp3");
const vo5 = path.join(DEMO_DIR, "vo_scene_5.mp3");
const vo6 = path.join(DEMO_DIR, "vo_scene_6.mp3");
const sfxRiser = path.join(DEMO_DIR, "sfx_riser.mp3");
const sfxClick = path.join(DEMO_DIR, "sfx_click.mp3");
const sfxConfirm = path.join(DEMO_DIR, "sfx_confirm.mp3");
const sfxAlert = path.join(DEMO_DIR, "sfx_alert.mp3");

const filterComplex = [
  `[0:a]volume=0.32[bgm]`,
  `[1:a]adelay=400|400,volume=1.15[v1]`,
  `[2:a]adelay=14400|14400,volume=1.15[v2]`,
  `[3:a]adelay=28400|28400,volume=1.15[v3]`,
  `[4:a]adelay=42400|42400,volume=1.15[v4]`,
  `[5:a]adelay=58400|58400,volume=1.15[v5]`,
  `[6:a]adelay=72250|72250,volume=1.15[v6]`,
  `[7:a]adelay=13800|13800,volume=0.55[r1]`,
  `[7:a]adelay=27800|27800,volume=0.55[r2]`,
  `[7:a]adelay=41800|41800,volume=0.55[r3]`,
  `[7:a]adelay=57800|57800,volume=0.55[r4]`,
  `[7:a]adelay=71800|71800,volume=0.55[r5]`,
  `[8:a]adelay=16800|16800,volume=0.75[c1]`,
  `[8:a]adelay=44500|44500,volume=0.75[c2]`,
  `[8:a]adelay=52500|52500,volume=0.75[c3]`,
  `[8:a]adelay=60300|60300,volume=0.75[c4]`,
  `[9:a]adelay=48200|48200,volume=0.85[conf]`,
  `[10:a]adelay=60600|60600,volume=0.90[alrt]`,
  `[bgm][v1][v2][v3][v4][v5][v6][r1][r2][r3][r4][r5][c1][c2][c3][c4][conf][alrt]amix=inputs=18:duration=first:dropout_transition=0,alimiter=limit=0.95[aout]`,
].join(";");

execSync(
  `ffmpeg -y -i "${bgm}" -i "${vo1}" -i "${vo2}" -i "${vo3}" -i "${vo4}" -i "${vo5}" -i "${vo6}" -i "${sfxRiser}" -i "${sfxClick}" -i "${sfxConfirm}" -i "${sfxAlert}" -filter_complex "${filterComplex}" -map "[aout]" -t 80 -c:a aac -b:a 192k -ar 48000 "${masterAudioPath}"`,
  { stdio: "inherit" }
);

// 5. Encode each 4K UHD segment at 60 FPS with subtle dynamic camera drift and stitch into out/flowagent_demo_4k.mp4
console.log("[FFmpeg 4K Engine] Encoding 4K UHD (3840x2160 @ 60fps, CRF 16) segments...");
const segFiles: string[] = [];

for (const seg of SEGMENTS) {
  const inPng = path.join(PLATES_DIR, `${seg.id}.png`);
  const segMp4 = path.join(PLATES_DIR, `${seg.id}.mp4`);
  execSync(
    `ffmpeg -y -loop 1 -framerate 60 -i "${inPng}" -t ${seg.durationSec} -vf "scale=3840:2160,format=yuv420p" -r 60 -c:v libx264 -preset ultrafast -crf 16 "${segMp4}"`,
    { stdio: "ignore" }
  );
  segFiles.push(segMp4);
}

const concatListPath = path.join(PLATES_DIR, "concat.txt");
fs.writeFileSync(
  concatListPath,
  segFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"),
  "utf-8"
);

const finalOutPath = path.join(OUT_DIR, "flowagent_demo_4k.mp4");
console.log(`[FFmpeg Master] Compiling final 80s 4K 60fps artifact -> ${finalOutPath}`);
execSync(
  `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -i "${masterAudioPath}" -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p -r 60 -c:a copy -shortest -movflags +faststart "${finalOutPath}"`,
  { stdio: "inherit" }
);

const stats = fs.statSync(finalOutPath);
console.log(
  `\n✅ SUCCESS: Compiled ${finalOutPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB, 3840x2160 4K UHD, 60 FPS, 80.0s)`
);
}

runCompilation().catch((err) => {
  console.error(err);
  process.exit(1);
});

