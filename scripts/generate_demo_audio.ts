import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const OUT_DIRS = [
  path.resolve(process.cwd(), "public", "demo"),
  path.resolve(process.cwd(), "video", "public", "demo"),
];

for (const dir of OUT_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
}

const PRIMARY_DIR = OUT_DIRS[0];

interface SceneVO {
  id: string;
  scene: number;
  startSec: number;
  windowSec: number;
  text: string;
}

const SCENES: SceneVO[] = [
  {
    id: "vo_scene_1",
    scene: 1,
    startSec: 0.6,
    windowSec: 13.0,
    text: "Every month, global import-export SMEs lose thousands of dollars to correspondent banking friction, paying up to 3.5% in hidden FX spreads and waiting 3 to 5 business days for simple cross-border wires. FlowAgent OS transforms this broken accounts payable workflow into an autonomous, non-custodial settlement engine.",
  },
  {
    id: "vo_scene_2",
    scene: 2,
    startSec: 14.5,
    windowSec: 13.0,
    text: "When commercial invoices arrive—via PDF, OCR, or ERP webhooks—our semantic layer extracts structured invoice schemas instantly, syncing directly with our U-Bot Copilot to prepare executive sign-off.",
  },
  {
    id: "vo_scene_3",
    scene: 3,
    startSec: 28.5,
    windowSec: 13.0,
    text: "Before any fund movement occurs, the deterministic routing core benchmarks the real cost: traditional banking drains 112 dollars and 50 cents with three intermediary banks. FlowAgent routes over Avalanche C-Chain for just 2 dollars and 50 cents, capturing 98% in fee savings.",
  },
  {
    id: "vo_scene_4",
    scene: 4,
    startSec: 42.5,
    windowSec: 15.0,
    text: "With one executive click, the non-custodial signer broadcasts directly to Avalanche Snowman BFT consensus. Irrevocable finality is achieved in milliseconds with full cryptographic verification and instant 1-click CSV reconciliation for local accounting suites like PEAK and FlowAccount.",
  },
  {
    id: "vo_scene_5",
    scene: 5,
    startSec: 58.5,
    windowSec: 13.0,
    text: "Financial operations demand zero tolerance for AI hallucinations. When an invoice targets an OFAC-sanctioned wallet, our Deterministic Compliance Guard terminates execution in under 35 milliseconds—guaranteeing zero funds move and zero gas is lost.",
  },
  {
    id: "vo_scene_6",
    scene: 6,
    startSec: 72.3,
    windowSec: 7.2,
    text: "AI at the interface. Deterministic code at the core. FlowAgent OS: institutional cross-border finance at the speed of consensus.",
  },
];

async function synthesizeElevenLabs(text: string, outPath: string, prevText?: string, nextText?: string): Promise<boolean> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return false;

  // Use authoritative institutional voice (Daniel: onwK4e9ZLuTAKqWW03F9 or configured voice)
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9";
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        previous_text: prevText,
        next_text: nextText,
        voice_settings: {
          stability: 0.62,
          similarity_boost: 0.82,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`ElevenLabs returned ${res.status}: ${errText.slice(0, 200)}`);
      return false;
    }

    const arrayBuf = await res.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(arrayBuf));
    console.log(`[ElevenLabs] Synthesized ${path.basename(outPath)} (${arrayBuf.byteLength} bytes)`);
    return true;
  } catch (err) {
    console.warn(`[ElevenLabs] Error synthesizing ${path.basename(outPath)}:`, err);
    return false;
  }
}

function synthesizeFallbackSapi(text: string, outMp3Path: string) {
  const wavPath = outMp3Path.replace(/\.mp3$/, ".wav");
  const escapedText = text.replace(/"/g, '`"').replace(/'/g, "''");
  const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices() | Where-Object { $_.Enabled }
foreach ($v in $voices) {
  if ($v.VoiceInfo.Name -match "David|Mark|Zira|Hazel|George") {
    $synth.SelectVoice($v.VoiceInfo.Name)
    break
  }
}
$synth.Rate = 1
$synth.SetOutputToWaveFile('${wavPath.replace(/\\/g, "\\\\")}')
$synth.Speak('${escapedText}')
$synth.Dispose()
`;
  const tempPs1 = path.join(PRIMARY_DIR, "temp_tts.ps1");
  fs.writeFileSync(tempPs1, psScript, "utf-8");
  execSync(`powershell -ExecutionPolicy Bypass -File "${tempPs1}"`, { stdio: "ignore" });
  if (fs.existsSync(tempPs1)) fs.unlinkSync(tempPs1);

  // Convert WAV to broadcast-mastered MP3 with subtle EQ & compression
  execSync(
    `ffmpeg -y -i "${wavPath}" -af "asetrate=22050*0.98,aresample=44100,atempo=1.04,equalizer=f=140:t=q:w=1.2:g=3,equalizer=f=3500:t=q:w=1.5:g=2,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=11" -c:a libmp3lame -b:a 192k "${outMp3Path}"`,
    { stdio: "ignore" }
  );
  if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
  console.log(`[Fallback TTS] Synthesized ${path.basename(outMp3Path)}`);
}

function getAudioDuration(filePath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
  )
    .toString()
    .trim();
  return parseFloat(out);
}

function fitAudioToWindow(filePath: string, maxDurationSec: number) {
  const dur = getAudioDuration(filePath);
  if (dur > maxDurationSec) {
    const tempo = Math.min(1.35, Number((dur / (maxDurationSec - 0.25)).toFixed(3)));
    const tmpPath = filePath.replace(/\.mp3$/, "_fit.mp3");
    execSync(
      `ffmpeg -y -i "${filePath}" -af "atempo=${tempo},loudnorm=I=-15:TP=-1.5:LRA=11" -c:a libmp3lame -b:a 192k "${tmpPath}"`,
      { stdio: "ignore" }
    );
    fs.renameSync(tmpPath, filePath);
    console.log(`  -> Fitted ${path.basename(filePath)} from ${dur.toFixed(2)}s to ${getAudioDuration(filePath).toFixed(2)}s (atempo=${tempo})`);
  } else {
    const tmpPath = filePath.replace(/\.mp3$/, "_norm.mp3");
    execSync(
      `ffmpeg -y -i "${filePath}" -af "loudnorm=I=-15:TP=-1.5:LRA=11" -c:a libmp3lame -b:a 192k "${tmpPath}"`,
      { stdio: "ignore" }
    );
    fs.renameSync(tmpPath, filePath);
    console.log(`  -> Normalized ${path.basename(filePath)} (${dur.toFixed(2)}s / window ${maxDurationSec}s)`);
  }
}

function writeWavAndConvertToMp3(mp3Path: string, durationSec: number, sampleFn: (t: number) => number) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const raw = Math.max(-1, Math.min(1, sampleFn(t)));
    buffer.writeInt16LE(Math.round(raw * 32767), 44 + i * 2);
  }

  const wavPath = mp3Path.replace(/\.mp3$/, ".wav");
  fs.writeFileSync(wavPath, buffer);
  execSync(`ffmpeg -y -i "${wavPath}" -c:a libmp3lame -b:a 192k "${mp3Path}"`, { stdio: "ignore" });
  if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
}

function generateSfx() {
  console.log("[SFX] Generating procedural studio sound design cues...");

  // 1. Sub-bass riser on scene transitions (1.2s deep sweep 45Hz -> 135Hz)
  writeWavAndConvertToMp3(path.join(PRIMARY_DIR, "sfx_riser.mp3"), 1.2, (t) => {
    const env = t < 0.6 ? t / 0.6 : t > 0.85 ? (1.2 - t) / 0.35 : 1.0;
    const phase = 2 * Math.PI * (45 * t + (45 * t * t) / 1.2);
    const sub = Math.sin(phase) * 0.7 + Math.sin(phase * 2) * 0.3;
    return sub * env * 0.42;
  });

  // 2. Soft tactile UI click (0.08s crisp transient)
  writeWavAndConvertToMp3(path.join(PRIMARY_DIR, "sfx_click.mp3"), 0.08, (t) => {
    const env = Math.exp(-t * 65);
    const tone = Math.sin(2 * Math.PI * 1450 * t) * 0.65 + Math.sin(2 * Math.PI * 2900 * t) * 0.35;
    return tone * env * 0.5;
  });

  // 3. Affirmative harmonic ping on on-chain confirmation (Emerald chord: C5 + E5 + G5 + B5 shimmer)
  writeWavAndConvertToMp3(path.join(PRIMARY_DIR, "sfx_confirm.mp3"), 1.5, (t) => {
    const attack = Math.min(1, t / 0.015);
    const decay = Math.exp(-t * 2.6);
    const c5 = Math.sin(2 * Math.PI * 523.25 * t);
    const e5 = Math.sin(2 * Math.PI * 659.25 * Math.max(0, t - 0.04));
    const g5 = Math.sin(2 * Math.PI * 783.99 * Math.max(0, t - 0.08));
    const b5 = Math.sin(2 * Math.PI * 987.77 * Math.max(0, t - 0.12));
    return ((c5 + e5 + g5 + b5) / 4) * attack * decay * 0.55;
  });

  // 4. Low alert pulse on OFAC violation (Rose warning double-pulse)
  writeWavAndConvertToMp3(path.join(PRIMARY_DIR, "sfx_alert.mp3"), 0.95, (t) => {
    const pulse = Math.sin(2 * Math.PI * 5.5 * t) > -0.2 ? 1.0 : 0.15;
    const env = Math.min(1, t / 0.02) * Math.max(0, 1 - t / 0.95);
    const tone =
      Math.sin(2 * Math.PI * 185 * t) * 0.5 +
      Math.sin(2 * Math.PI * 138.59 * t) * 0.35 +
      Math.sin(2 * Math.PI * 370 * t) * 0.15;
    return tone * pulse * env * 0.55;
  });

  // 5. Subtle dark institutional ambient pad (80 seconds)
  writeWavAndConvertToMp3(path.join(PRIMARY_DIR, "bgm_ambient.mp3"), 80.0, (t) => {
    const fadeIn = Math.min(1, t / 2.5);
    const fadeOut = t > 76.5 ? Math.max(0, (80.0 - t) / 3.5) : 1.0;
    const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.18 * t);
    const c2 = Math.sin(2 * Math.PI * 65.41 * t) * 0.4;
    const g2 = Math.sin(2 * Math.PI * 98.0 * t) * 0.3;
    const c3 = Math.sin(2 * Math.PI * 130.81 * t) * 0.2;
    const d3 = Math.sin(2 * Math.PI * 146.83 * t) * 0.1;
    return (c2 + g2 + c3 + d3) * lfo * fadeIn * fadeOut * 0.12;
  });

  console.log("[SFX] All SFX and ambient beds generated.");
}

async function main() {
  generateSfx();

  const metadata: Record<string, { startSec: number; durationSec: number; text: string; file: string }> = {};

  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    const outPath = path.join(PRIMARY_DIR, `${s.id}.mp3`);
    const prevText = i > 0 ? SCENES[i - 1].text : undefined;
    const nextText = i < SCENES.length - 1 ? SCENES[i + 1].text : undefined;

    const ok = await synthesizeElevenLabs(s.text, outPath, prevText, nextText);
    if (!ok) {
      synthesizeFallbackSapi(s.text, outPath);
    }
    fitAudioToWindow(outPath, s.windowSec);

    const finalDur = getAudioDuration(outPath);
    metadata[s.id] = {
      startSec: s.startSec,
      durationSec: Number(finalDur.toFixed(3)),
      text: s.text,
      file: `demo/${s.id}.mp3`,
    };
  }

  fs.writeFileSync(path.join(PRIMARY_DIR, "audio_manifest.json"), JSON.stringify(metadata, null, 2));

  // Mirror all generated files to video/public/demo
  for (const file of fs.readdirSync(PRIMARY_DIR)) {
    fs.copyFileSync(path.join(PRIMARY_DIR, file), path.join(OUT_DIRS[1], file));
  }

  console.log("[Audio Pipeline] Completed and mirrored to public/demo and video/public/demo!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
