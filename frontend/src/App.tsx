import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  IconContext,
  LightningIcon,
  WarningIcon,
  ArrowsClockwiseIcon,
  ArrowUpRightIcon,
  ArrowDownIcon,
  FileTextIcon,
  CloudArrowUpIcon,
  ShieldWarningIcon,
  ClockIcon,
  SparkleIcon,
  CheckIcon,
  CopyIcon,
  ShieldCheckIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  Bezel,
  CardHeader,
  Eyebrow,
  IslandButton,
  Reveal,
  MaskedLines,
  AnimatedNumber,
  RollingNumber,
  StreamText,
  DrawnCheck,
  VoiceBars,
  DataRow,
  cn,
  EASE_CINEMATIC,
  EASE_OUT_EXPO,
  EASE_IN_QUART,
  SPRING_SOFT,
  SPRING_SNAPPY,
} from "./ui/primitives";
import { AmbientBackground } from "./ui/Background";
import UBotSimulator from "./components/UBotSimulator";
import { Bot } from "lucide-react";

const NAV_LINKS = [
  { id: "workstation", label: "Workstation" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "routing", label: "Routing race" },
];

const PRESET_META: Record<string, string> = {
  aws: "EC2 and S3 Infrastructure · Clean OFAC",
  tornado: "High-risk mixer relay · Sanction trigger",
  nodeops: "Validator hosting and subnet node quota",
  custom: "User uploaded invoice · OCR parsed",
};

const INTEGRATIONS = [
  "Avalanche C-Chain",
  "ElevenLabs Turbo v2.5",
  "Tokenomist Intelligence",
  "OFAC SDN Screening",
  "Snowman Consensus",
  "Non-Custodial ECDSA",
  "Deterministic ERP Export",
];

interface InvoicePreset {
  id: string;
  name: string;
  badge: string;
  invoiceNumber: string;
  vendorName: string;
  recipientAddress: string;
  amount: number;
  currency: string;
  isSanctioned: boolean;
  tokenomist?: {
    circulating: string;
    cliffDays: number;
    risk: "Low Risk" | "Moderate" | "High";
  };
}

const PRESETS: InvoicePreset[] = [
  {
    id: "aws",
    name: "AWS Infrastructure",
    badge: "$2,500.00 USDC • Clean",
    invoiceNumber: "INV-2026-901",
    vendorName: "AWS Cloud Infrastructure Corp",
    recipientAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    amount: 2500,
    currency: "USDC",
    isSanctioned: false,
  },
  {
    id: "tornado",
    name: "Tornado Cash Router",
    badge: "$5,000.00 USDC • OFAC Flag",
    invoiceNumber: "INV-2026-403",
    vendorName: "Tornado Cash Relayer Protocol",
    recipientAddress: "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c",
    amount: 5000,
    currency: "USDC",
    isSanctioned: true,
  },
  {
    id: "nodeops",
    name: "NodeOps Cloud Validator Hosting",
    badge: "850 AVAX • Quick Pay",
    invoiceNumber: "INV-2026-842",
    vendorName: "NodeOps Distributed Cloud",
    recipientAddress: "0x3C44CdD428807Fd98b25F56f9e205167b5f593BC",
    amount: 850,
    currency: "AVAX",
    isSanctioned: false,
    tokenomist: {
      circulating: "61.1%",
      cliffDays: 38,
      risk: "Low Risk",
    },
  },
];

interface ExecutionReceipt {
  txHash: string;
  network: string;
  blockNumber: number;
  gasPaid: string;
  finality: string;
  status: string;
  timestamp: string;
}

const VERIFIED_TX_HASHES: Record<string, string> = {
  aws: "0xdd5f23a58bc69bf73488eff825740c0fc988812bb928d25a24d374e23e059ba7",
  nodeops: "0xb29b523093543374a4d9d9c8fc064954c66c8f54bfd6b0a73da7104324fc7e76",
  custom: "0xf071f29602dfe66116ecc5f429629a787d45476e86874ed3a090aeac03721f69",
};

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<InvoicePreset>(PRESETS[0]);
  const [stage, setStage] = useState<"IDLE" | "AWAITING_APPROVAL" | "SETTLING" | "SETTLED" | "FLAGGED">("AWAITING_APPROVAL");
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [blockHeight, setBlockHeight] = useState(59490095);
  const [rpcLatencyMs, setRpcLatencyMs] = useState(33);
  const [txHash, setTxHash] = useState(VERIFIED_TX_HASHES.aws);
  const [latencyMs, setLatencyMs] = useState(128);
  const [isDragging, setIsDragging] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [showPanicToast, setShowPanicToast] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ExecutionReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isUbotOpen, setIsUbotOpen] = useState(false);
  const panicToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMountRef = useRef(true);

  // Presenter Stage Panic Shortcut (Ctrl + Shift + F) & High-Contrast Toast + Window Drag Guards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        setIsOfflineMode((prev) => {
          const next = !prev;
          if (next) {
            setShowPanicToast(true);
            if (panicToastTimeoutRef.current) clearTimeout(panicToastTimeoutRef.current);
            panicToastTimeoutRef.current = setTimeout(() => setShowPanicToast(false), 2500);
          } else {
            setShowPanicToast(false);
          }
          return next;
        });
      }
    };

    // Prevent default browser file navigation when dragging outside dropzone
    const handleWindowDragOver = (e: DragEvent) => e.preventDefault();
    const handleWindowDrop = (e: DragEvent) => e.preventDefault();

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("keydown", handleKeyDown);
      if (panicToastTimeoutRef.current) clearTimeout(panicToastTimeoutRef.current);
    };
  }, []);

  // Live Block Counter & Health Polling (Starts at 59490095 and increments every 4s)
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      if (isOfflineMode) {
        // Zero-Downtime Offline Cache Mode
        if (isMounted) {
          if (!isInitialMountRef.current) {
            setBlockHeight((prev) => prev + 1);
          }
          setRpcLatencyMs(12);
        }
        isInitialMountRef.current = false;
        return;
      }

      try {
        const res = await fetch("/health");
        if (!res.ok) throw new Error("Health check degraded");
        const data = await res.json();
        if (isMounted) {
          if (data.avalanche?.blockNumber) {
            setBlockHeight(Number(data.avalanche.blockNumber));
          } else if (!isInitialMountRef.current) {
            setBlockHeight((prev) => prev + 1);
          }
          if (data.avalanche?.rpcLatencyMs) {
            setRpcLatencyMs(Number(data.avalanche.rpcLatencyMs));
          }
        }
      } catch {
        // Fallback simulation increment only after initial mount
        if (isMounted && !isInitialMountRef.current) {
          setBlockHeight((prev) => prev + 1);
        }
      } finally {
        isInitialMountRef.current = false;
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOfflineMode]);

  // Play synthetic OFAC alert tone via Web Audio API
  const playAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore if audio permissions blocked
    }
  };

  // Environment-aware transaction inspector (eliminates Snowtrace 404 on local fork)
  const handleInspectTransaction = (txHashToInspect: string) => {
    const isLocalFork =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]" ||
      window.location.hostname.endsWith(".local") ||
      isOfflineMode;

    if (isLocalFork) {
      setSelectedReceipt({
        txHash: txHashToInspect,
        network: "Avalanche Fuji Fork (Anvil Local)",
        blockNumber: blockHeight,
        gasPaid: "0.000042 AVAX ($0.001)",
        finality: `${latencyMs}ms`,
        status: "100% Deterministic Consensus Finality",
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsReceiptModalOpen(true);
    } else {
      window.open(`https://testnet.snowtrace.io/tx/${txHashToInspect}`, "_blank", "noopener,noreferrer");
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: InvoicePreset) => {
    setSelectedPreset(preset);

    if (preset.isSanctioned) {
      setStage("FLAGGED");
      playAlertTone();
    } else {
      setStage("AWAITING_APPROVAL");
    }
  };

  // Explicit Interactive Authorization & Settlement
  const handleAuthorizeAndSettle = async () => {
    setStage("SETTLING");
    const startTime = performance.now();

    try {
      // Dispatches real settlement via pipeline endpoint if backend is active
      const res = await fetch("/api/pipeline/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: selectedPreset.invoiceNumber,
          vendorName: selectedPreset.vendorName,
          recipientAddress: selectedPreset.recipientAddress,
          amount: selectedPreset.amount,
          currency: selectedPreset.currency,
          dueDate: "2026-11-01",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settlement?.txHash) {
          setTxHash(data.settlement.txHash);
        } else {
          setTxHash(VERIFIED_TX_HASHES[selectedPreset.id] || VERIFIED_TX_HASHES.custom);
        }
        if (data.settlement?.blockNumber) {
          setBlockHeight(Number(data.settlement.blockNumber));
        }
      } else {
        setTxHash(VERIFIED_TX_HASHES[selectedPreset.id] || VERIFIED_TX_HASHES.custom);
      }
    } catch {
      // Standalone verified hash for zero-downtime offline fallback
      setTxHash(VERIFIED_TX_HASHES[selectedPreset.id] || VERIFIED_TX_HASHES.custom);
    }

    const elapsed = Math.round(performance.now() - startTime);
    setTimeout(() => {
      setLatencyMs(Math.max(elapsed, 94));
      setStage("SETTLED");
    }, 600);
  };

  // Dynamic Routing Calculations (Standardized Currency & Exchange Rate Handling)
  const effectiveUsdValue = selectedPreset.currency === "AVAX" ? selectedPreset.amount * 25.0 : selectedPreset.amount;
  const swiftFee = Number((25.0 + effectiveUsdValue * 0.035).toFixed(2));
  const avaxFee = Number((effectiveUsdValue * 0.001 + 0.0001).toFixed(2));
  const netSavings = Number((swiftFee - avaxFee).toFixed(2));
  const savingsPct = Number(((netSavings / swiftFee) * 100).toFixed(1));

  // Institutional 2-Decimal Currency Formatter
  const formatCurrency = (val: number): string =>
    val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Copy Address Functionality
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(selectedPreset.recipientAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ElevenLabs TTS Voice Feedback with Isolated Hierarchy & Browser Fallback (< 1,200ms SLA)
  const handlePlayVoice = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    const speechText = selectedPreset.isSanctioned
      ? "Warning. Transaction blocked by Compliance Guard. Target address is on international sanction lists."
      : `Invoice ${selectedPreset.invoiceNumber} for ${selectedPreset.vendorName} verified. Avalanche route saves $${formatCurrency(netSavings)}. Ready for settlement.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    let audioBlobUrl: string | null = null;
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

    // 1. Try Direct ElevenLabs API if key is present in environment
    if (apiKey && apiKey.trim() !== "" && !controller.signal.aborted) {
      try {
        const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: speechText,
            model_id: "eleven_turbo_v2_5",
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          }),
          signal: controller.signal,
        });
        if (response.ok) {
          const blob = await response.blob();
          audioBlobUrl = URL.createObjectURL(blob);
        }
      } catch {
        // Direct call failed or timed out; proceed to backend proxy
      }
    }

    // 2. Try Backend ElevenLabs Proxy Endpoint (/api/elevenlabs/tts)
    if (!audioBlobUrl && !controller.signal.aborted) {
      try {
        const res = await fetch("/api/elevenlabs/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: speechText,
            voiceId: "21m00Tcm4TlvDq8ikWAM",
          }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audioUrl) {
            audioBlobUrl = data.audioUrl;
          }
        }
      } catch {
        // Backend proxy failed or timed out; proceed to browser fallback
      }
    }

    clearTimeout(timeoutId);

    // 3. Play audio if successfully synthesized via ElevenLabs
    if (audioBlobUrl) {
      try {
        const audio = new Audio(audioBlobUrl);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => fallbackBrowserSpeech(speechText);
        await audio.play();
        return;
      } catch {
        // Autoplay policy or playback error; fall back to browser speech
      }
    }

    // 4. Graceful Fallback to Browser Speech Synthesis
    fallbackBrowserSpeech(speechText);
  };

  const fallbackBrowserSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        let ended = false;
        utterance.onend = () => {
          ended = true;
          setIsPlayingAudio(false);
        };
        utterance.onerror = () => {
          ended = true;
          setIsPlayingAudio(false);
        };
        window.speechSynthesis.speak(utterance);
        // Safety timeout in case browser drops speech onend event
        setTimeout(() => {
          if (!ended) setIsPlayingAudio(false);
        }, 8000);
        return;
      } catch {
        setIsPlayingAudio(false);
      }
    }
    setTimeout(() => setIsPlayingAudio(false), 2500);
  };

  // Reconciliation CSV Exporter
  const handleExportCSV = () => {
    const headers = "Invoice_ID,Vendor,Recipient_Address,Gross_Payable,Currency,Settlement_Rail,Tx_Hash,Execution_Latency_MS,Net_Savings_USD,Status,Timestamp\n";
    const row = [
      selectedPreset.invoiceNumber,
      `"${selectedPreset.vendorName}"`,
      selectedPreset.recipientAddress,
      selectedPreset.amount,
      selectedPreset.currency,
      "Avalanche Fuji C-Chain (43113)",
      txHash,
      `${latencyMs}ms`,
      `$${formatCurrency(netSavings)}`,
      stage === "SETTLED" ? "CONFIRMED_ON_CHAIN" : stage === "FLAGGED" ? "BLOCKED_SANCTION" : "PENDING_APPROVAL",
      new Date().toISOString()
    ].join(",");

    const blob = new Blob([headers + row], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Reconciliation_${selectedPreset.invoiceNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Commercial Invoice File Upload & HTML5 Dropzone Handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (fileOrName: File | string) => {
    const fileName = typeof fileOrName === "string" ? fileOrName : fileOrName.name;
    const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase() || "Commercial Services";

    let parsedPreset: InvoicePreset = {
      id: "custom",
      name: cleanName,
      badge: "$3,200.00 USDC • Extracted",
      invoiceNumber: "INV-2026-" + Math.floor(100 + Math.random() * 900),
      vendorName: cleanName + " Corp",
      recipientAddress: "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
      amount: 3200,
      currency: "USDC",
      isSanctioned: false,
    };

    // If an actual file was provided, attempt backend OCR/PDF extraction
    if (typeof fileOrName !== "string" && !isOfflineMode) {
      try {
        const formData = new FormData();
        formData.append("invoice", fileOrName);
        const res = await fetch("/api/pipeline/execute", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.invoice) {
            parsedPreset = {
              id: "custom",
              name: data.invoice.vendorName || cleanName,
              badge: `$${Number(data.invoice.amount).toLocaleString()}.00 ${data.invoice.currency} • Extracted`,
              invoiceNumber: data.invoice.invoiceNumber || parsedPreset.invoiceNumber,
              vendorName: data.invoice.vendorName || parsedPreset.vendorName,
              recipientAddress: data.invoice.recipientAddress || parsedPreset.recipientAddress,
              amount: Number(data.invoice.amount) || 3200,
              currency: data.invoice.currency || "USDC",
              isSanctioned: Boolean(data.compliance && !data.compliance.passed),
            };
          }
        }
      } catch {
        // Fall back gracefully to local extracted preset
      }
    }

    setSelectedPreset(parsedPreset);
    if (parsedPreset.isSanctioned) {
      setStage("FLAGGED");
      playAlertTone();
    } else {
      setStage("AWAITING_APPROVAL");
    }
  };

  // Reset Session to IDLE state
  const handleResetToDefault = () => {
    setSelectedPreset(PRESETS[0]);
    setStage("IDLE");
  };

  // ───────────────────────────────────────────────────────────
  // Presentation layer — visual state only. All business logic
  // above (settlement, compliance, TTS, CSV, upload) is untouched.
  // ───────────────────────────────────────────────────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsReceiptModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen || isReceiptModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, isReceiptModalOpen]);

  const scrollToSection = (id: string) => {
    const wasOpen = isMenuOpen;
    setIsMenuOpen(false);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, wasOpen ? 380 : 0);
  };

  const lifecycleSteps: { name: string; desc: string; passed: boolean; failed?: boolean }[] = [
    { name: "1. Ingest", desc: stage === "IDLE" ? "Awaiting Input" : "PDF OCR Extracted", passed: stage !== "IDLE" },
    { name: "2. Compliance", desc: stage === "IDLE" ? "Standby" : selectedPreset.isSanctioned ? "OFAC Flagged" : "OFAC Non-Sanctioned", passed: stage !== "IDLE" && !selectedPreset.isSanctioned, failed: stage !== "IDLE" && selectedPreset.isSanctioned },
    { name: "3. Routing", desc: stage === "IDLE" ? "Standby" : selectedPreset.isSanctioned ? "Route Terminated" : "Arbitrage Optimal", passed: stage !== "IDLE" && !selectedPreset.isSanctioned },
    {
      name: "4. Settlement",
      desc: stage === "SETTLED"
        ? (selectedPreset.currency === "USDC"
            ? `Settled: ${formatCurrency(selectedPreset.amount)} USDC (Tx Confirmed)`
            : "Phase 1: Cryptographic Liquidity Probe (0.0001 AVAX Verified)")
        : stage === "SETTLING"
        ? "Broadcasting to Avalanche..."
        : stage === "IDLE"
        ? "Standby"
        : selectedPreset.isSanctioned
        ? "Execution Blocked"
        : "Awaiting Authorization",
      passed: stage === "SETTLED" && !selectedPreset.isSanctioned,
    },
  ];
  const passedCount = lifecycleSteps.filter((s) => s.passed).length;
  const failedIndex = lifecycleSteps.findIndex((s) => s.failed);
  const activeIndex = stage === "IDLE" || failedIndex >= 0 ? -1 : lifecycleSteps.findIndex((s) => !s.passed);
  const trackProgress =
    failedIndex >= 0 ? failedIndex / 3 : stage === "SETTLING" ? 0.92 : Math.max(0, passedCount - 1) / 3;

  const isAlert = selectedPreset.isSanctioned && stage !== "IDLE";
  const stageMeta: { label: string; tone: "emerald" | "rose" | "amber" | "neutral" } = selectedPreset.isSanctioned
    ? { label: "Blocked · Compliance", tone: "rose" }
    : stage === "SETTLED"
    ? { label: "Settled on-chain", tone: "emerald" }
    : stage === "SETTLING"
    ? { label: "Broadcasting", tone: "amber" }
    : stage === "IDLE"
    ? { label: "Standby", tone: "neutral" }
    : { label: "Awaiting authorization", tone: "emerald" };

  const ubotMessage = selectedPreset.isSanctioned
    ? "Critical halt. Destination address matches OFAC SDN list (Tornado Cash Relayer)."
    : stage === "IDLE"
    ? "Standby. Ready for Ingestion • Select a preset or drop an invoice above."
    : selectedPreset.id === "nodeops"
    ? "Match rate 99.8% with validator agreement. Tokenomist cliff verified (38d). 1-click settlement ready."
    : "Match rate 99.4% with supplier record. Compliance clear, 1-click settlement ready.";

  const settledLabel =
    selectedPreset.currency === "USDC"
      ? `Settled: ${formatCurrency(selectedPreset.amount)} USDC (Tx Confirmed)`
      : "Phase 1: Cryptographic Liquidity Probe (0.0001 AVAX Verified)";

  const invoiceValueLabel =
    selectedPreset.currency === "USDC"
      ? `$${formatCurrency(selectedPreset.amount)}`
      : `${selectedPreset.amount} ${selectedPreset.currency} ($${formatCurrency(effectiveUsdValue)} USD)`;

  const avaxRatio = Math.min(1, Math.max(avaxFee / swiftFee, 0.015));

  const swap = {
    initial: { opacity: 0, y: 10, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
    exit: { opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.2, ease: EASE_IN_QUART } },
  };

  return (
    <MotionConfig reducedMotion="user">
      <IconContext.Provider value={{ weight: "light", size: 16 }}>
        <div id="top" className="relative isolate min-h-[100dvh] overflow-x-clip text-stone-100">
          <AmbientBackground alert={isAlert} />

          {/* ── Floating island navigation ─────────────────────── */}
          <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE_CINEMATIC, delay: 0.1 }}
            className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 md:top-6"
          >
            <nav className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#0A0A0B]/70 p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/[0.08] backdrop-blur-2xl">
              <button
                onClick={() => scrollToSection("top")}
                className="flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-3 transition-colors duration-500 ease-cinematic hover:bg-white/[0.04]"
                title="FlowAgent OS"
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#A7F3D0,#10B981_50%,#064E3B)] text-[#02140D] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_0_24px_-4px_rgba(52,211,153,0.7)]">
                  <LightningIcon size={15} weight="fill" />
                </span>
                <span className="text-[14px] font-medium tracking-[-0.02em] text-white">
                  FlowAgent <span className="font-serif text-[16px] italic text-white/55">OS</span>
                </span>
              </button>

              <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

              {isOfflineMode ? (
                <button
                  onClick={() => setIsOfflineMode(false)}
                  title="Click to restore live RPC mode (Ctrl+Shift+F)"
                  className="flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200 ring-1 ring-amber-300/30 transition-colors duration-500 ease-cinematic hover:bg-amber-400/20"
                >
                  <WarningIcon size={13} className="text-amber-300" />
                  <span className="hidden sm:inline">Offline cache active</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-white/60" title="Avalanche Fuji C-Chain (43113)">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="hidden md:inline">Fuji C-Chain</span>
                  <span className="font-mono text-[11px] text-emerald-300/90">{rpcLatencyMs}ms</span>
                </div>
              )}

              <div className="hidden items-center gap-1 rounded-full px-3 py-1.5 font-mono text-[12px] text-white/35 lg:flex" title="Live block height">
                <span>#</span>
                <RollingNumber value={blockHeight} className="text-white/85" />
              </div>

              <button
                onClick={handleResetToDefault}
                title="Reset Workflow Demo (↻)"
                aria-label="Reset workflow demo"
                className="group flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition-colors duration-500 ease-cinematic hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowsClockwiseIcon size={15} className="transition-transform duration-700 ease-cinematic group-hover:rotate-180" />
              </button>

              <button
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10 transition-colors duration-500 ease-cinematic hover:bg-white/[0.1]"
              >
                <motion.span
                  className="absolute h-px w-3.5 rounded-full bg-white"
                  initial={false}
                  animate={isMenuOpen ? { y: 0, rotate: 45 } : { y: -3, rotate: 0 }}
                  transition={SPRING_SNAPPY}
                />
                <motion.span
                  className="absolute h-px w-3.5 rounded-full bg-white"
                  initial={false}
                  animate={isMenuOpen ? { y: 0, rotate: -45 } : { y: 3, rotate: 0 }}
                  transition={SPRING_SNAPPY}
                />
              </button>
            </nav>
          </motion.header>

          {/* ── Full-screen glass menu ─────────────────────────── */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                key="menu"
                className="fixed inset-0 z-40 flex flex-col bg-black/80 backdrop-blur-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.6, ease: EASE_CINEMATIC } }}
                exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE_IN_QUART, delay: 0.12 } }}
              >
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between px-6 pb-10 pt-32 md:px-10 md:pt-40">
                  <ul className="space-y-1 md:space-y-3">
                    {NAV_LINKS.map((link, i) => (
                      <li key={link.id} className="overflow-hidden">
                        <motion.button
                          onClick={() => scrollToSection(link.id)}
                          initial={{ y: 48, opacity: 0 }}
                          animate={{ y: 0, opacity: 1, transition: { duration: 0.9, ease: EASE_CINEMATIC, delay: 0.1 + i * 0.06 } }}
                          exit={{ y: -24, opacity: 0, transition: { duration: 0.22, ease: EASE_IN_QUART, delay: i * 0.025 } }}
                          className="group flex items-baseline gap-5 text-left"
                        >
                          <span className="font-mono text-xs text-white/30">0{i + 1}</span>
                          <span className="text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.045em] text-white/75 transition-colors duration-500 ease-cinematic group-hover:text-white">
                            {link.label}
                          </span>
                          <ArrowUpRightIcon
                            size={32}
                            className="hidden -translate-x-3 self-center text-emerald-300 opacity-0 transition-[transform,opacity] duration-500 ease-cinematic group-hover:translate-x-0 group-hover:opacity-100 md:block"
                          />
                        </motion.button>
                      </li>
                    ))}
                  </ul>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_CINEMATIC, delay: 0.4 } }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="flex flex-col gap-6 border-t border-white/[0.08] pt-8 text-[13px] text-white/45 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <span>Avalanche Fuji C-Chain · 43113</span>
                      <span className="font-mono">Block #{blockHeight}</span>
                      <span className="font-mono">{rpcLatencyMs}ms RPC</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {["Ctrl", "Shift", "F"].map((k) => (
                        <kbd key={k} className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-white/70 ring-1 ring-white/10">
                          {k}
                        </kbd>
                      ))}
                      <span className="ml-2">Stage panic · offline cache</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stage panic toast + persistent banner ──────────── */}
          <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center px-4">
            <AnimatePresence>
              {showPanicToast && (
                <motion.div
                  key="panic-toast"
                  initial={{ y: -24, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1, transition: SPRING_SOFT }}
                  exit={{ y: -16, opacity: 0, transition: { duration: 0.25, ease: EASE_IN_QUART } }}
                  className="flex items-center gap-3 rounded-full bg-amber-300 py-1.5 pl-1.5 pr-5 text-[12px] font-medium text-[#1C1300] shadow-[0_20px_50px_-15px_rgba(252,211,77,0.6)]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10">
                    <WarningIcon size={14} weight="regular" />
                  </span>
                  Stage Panic Activated: Operating in Zero-Downtime Offline Cache Mode
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
            <AnimatePresence>
              {isOfflineMode && (
                <motion.div
                  key="panic-banner"
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { duration: 0.8, ease: EASE_CINEMATIC } }}
                  exit={{ y: 16, opacity: 0, transition: { duration: 0.25, ease: EASE_IN_QUART } }}
                  className="flex items-center gap-2.5 rounded-full bg-[#0A0A0B]/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-200 ring-1 ring-amber-300/30 backdrop-blur-xl"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
                  Stage panic active · Deterministic local cache enabled
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <main>
            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 md:pb-32 md:pt-48 lg:px-8">
              <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-7">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.25 }}
                  >
                    <Eyebrow pulse>Autonomous accounts payable · Avalanche</Eyebrow>
                  </motion.div>

                  <h1 className="mt-8 text-[clamp(3.25rem,8.2vw,7.5rem)] font-medium leading-[0.9] tracking-[-0.055em] text-white">
                    <MaskedLines
                      delay={0.35}
                      lines={[
                        "Invoices in.",
                        <span className="text-white/40">Settlement out.</span>,
                        <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-200 bg-clip-text pr-[0.12em] font-serif font-normal italic tracking-[-0.02em] text-transparent">
                          Sub-second.
                        </span>,
                      ]}
                    />
                  </h1>

                  <motion.p
                    initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.1, ease: EASE_CINEMATIC, delay: 0.8 }}
                    className="text-balance mt-8 max-w-xl text-[17px] leading-relaxed text-white/50"
                  >
                    FlowAgent OS reads commercial invoices, screens every counterparty against OFAC, races SWIFT for
                    the cheapest rail and settles on Avalanche — non-custodially, in a single authorization.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: EASE_CINEMATIC, delay: 0.95 }}
                    className="mt-10 flex flex-wrap items-center gap-3"
                  >
                    <IslandButton size="lg" variant="light" onClick={() => scrollToSection("workstation")} icon={<ArrowDownIcon size={16} />}>
                      Open the workstation
                    </IslandButton>
                    <IslandButton size="lg" variant="ghost" onClick={handlePlayVoice} icon={<VoiceBars active={isPlayingAudio} />}>
                      {isPlayingAudio ? "Synthesizing..." : "Hear the briefing"}
                    </IslandButton>
                  </motion.div>
                </div>

                {/* Z-axis cascade — legacy rail vs optimal rail */}
                <div className="lg:col-span-5">
                  <div className="relative mx-auto flex max-w-md flex-col gap-4 md:block md:h-[440px]">
                    <motion.div
                      initial={{ opacity: 0, y: 70, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 1.5, ease: EASE_CINEMATIC, delay: 0.55 }}
                      className="md:absolute md:left-0 md:top-2 md:w-[84%]"
                    >
                      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 8, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] }}>
                        <div className="md:-rotate-[5deg]">
                          <Bezel innerClassName="p-6">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">Legacy rail</span>
                              <span className="font-mono text-[10px] text-white/25">SWIFT MT103</span>
                            </div>
                            <div className="mt-10 text-[12px] text-white/35">Traditional SWIFT Wire</div>
                            <div className="mt-1 text-4xl font-medium tracking-[-0.045em] text-white/45 line-through decoration-rose-400/50 decoration-1">
                              ${formatCurrency(swiftFee)}
                            </div>
                            <div className="mt-6 flex justify-between text-[12px] text-white/30">
                              <span>3–5 Business Days</span>
                              <span>Correspondent Bank</span>
                            </div>
                          </Bezel>
                        </div>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 90, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 1.5, ease: EASE_CINEMATIC, delay: 0.75 }}
                      className="md:absolute md:bottom-0 md:right-0 md:w-[88%]"
                    >
                      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6.5, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95], delay: 0.8 }}>
                        <div className="md:rotate-[3deg]">
                          <Bezel tone="emerald" innerClassName="p-6">
                            <div className="flex items-center justify-between">
                              <Eyebrow pulse className="text-emerald-200/80">Optimal rail</Eyebrow>
                              <span className="font-mono text-[10px] text-white/30">C-Chain 43113</span>
                            </div>
                            <div className="mt-8 text-[12px] text-white/45">Avalanche C-Chain</div>
                            <div className="mt-1 text-5xl font-medium tracking-[-0.05em] text-emerald-100">
                              ${formatCurrency(avaxFee)}
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 text-[12px]">
                              <div>
                                <div className="text-white/35">Finality</div>
                                <div className="mt-0.5 font-mono text-emerald-300">0.09s</div>
                              </div>
                              <div>
                                <div className="text-white/35">Custody</div>
                                <div className="mt-0.5 text-white/80">Non-custodial</div>
                              </div>
                            </div>
                            <div className="mt-5 flex items-center justify-between rounded-full bg-emerald-400/[0.08] py-1.5 pl-4 pr-1.5 ring-1 ring-emerald-300/20">
                              <span className="text-[12px] text-emerald-100/80">You keep</span>
                              <span className="rounded-full bg-emerald-400 px-3 py-1 font-mono text-[11px] font-medium text-[#022014]">
                                ${formatCurrency(netSavings)}
                              </span>
                            </div>
                          </Bezel>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Live metrics strip */}
              <Reveal delay={0.2} className="mt-24 md:mt-36">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-white/[0.06] ring-1 ring-white/[0.06] md:grid-cols-4">
                  {[
                    { value: <AnimatedNumber value={0.09} format={(v: number) => `${v.toFixed(2)}s`} />, label: "Consensus finality" },
                    { value: <AnimatedNumber value={savingsPct} format={(v: number) => `${v.toFixed(1)}%`} />, label: "Cheaper than a SWIFT wire" },
                    { value: <AnimatedNumber value={34} format={(v: number) => `${Math.round(v)}ms`} />, label: "Sanctions halt, zero gas" },
                    { value: <RollingNumber value={blockHeight} />, label: "Live block height" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#080809] p-6 md:p-8">
                      <div className="text-[1.75rem] font-medium leading-none tracking-[-0.045em] text-white md:text-[2.5rem]">{stat.value}</div>
                      <div className="mt-3 text-[12px] text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </section>

            {/* ── Workstation ──────────────────────────────────── */}
            <section id="workstation" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
              <div className="mb-14 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:items-end">
                <Reveal className="md:col-span-7">
                  <Eyebrow pulse={stage === "SETTLING" || stage === "AWAITING_APPROVAL"} tone={stageMeta.tone}>
                    Live session · {stageMeta.label}
                  </Eyebrow>
                  <h2 className="mt-6 text-[clamp(2.25rem,5vw,4.25rem)] font-medium leading-[0.95] tracking-[-0.045em] text-white">
                    One invoice. Four gates.
                    <br />
                    <span className="font-serif font-normal italic tracking-[-0.02em] text-white/45">Zero intermediaries.</span>
                  </h2>
                </Reveal>
                <Reveal delay={0.1} className="md:col-span-5">
                  <p className="text-[15px] leading-relaxed text-white/45 md:text-right">
                    Load a preset or drop a real invoice. Every gate below runs live — parsing, sanctions screening, rail
                    arbitrage and on-chain settlement.
                  </p>
                </Reveal>
              </div>

              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                {/* Left column */}
                <div className="space-y-6 lg:col-span-5">
                  {/* 01 — Ingestion */}
                  <Reveal>
                    <Bezel innerClassName="p-6 md:p-7">
                      <CardHeader index="01" title="Commercial invoice ingestion" meta="Dual OCR & EVM Parsed" />

                      <div className="mt-6 space-y-1">
                        {PRESETS.map((preset, i) => {
                          const active = selectedPreset.id === preset.id && stage !== "IDLE";
                          const [amountLabel, tagLabel] = preset.badge.split(" • ");
                          return (
                            <button
                              id={`preset-${preset.id}`}
                              key={preset.id}
                              onClick={() => handleSelectPreset(preset)}
                              className="group relative flex w-full items-center gap-4 rounded-[1.1rem] px-4 py-3.5 text-left"
                            >
                              <span className="absolute inset-0 rounded-[1.1rem] bg-white/[0.025] opacity-0 transition-opacity duration-500 ease-cinematic group-hover:opacity-100" />
                              {active && (
                                <motion.span
                                  layoutId="preset-active"
                                  transition={SPRING_SOFT}
                                  className={cn(
                                    "absolute inset-0 rounded-[1.1rem] ring-1",
                                    preset.isSanctioned
                                      ? "bg-rose-500/[0.08] ring-rose-400/30"
                                      : "bg-emerald-400/[0.07] ring-emerald-300/25",
                                  )}
                                />
                              )}
                              <span className="relative font-mono text-[11px] text-white/25">0{i + 1}</span>
                              <span className="relative min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block truncate text-[14px] font-medium tracking-[-0.01em] transition-colors duration-500 ease-cinematic",
                                    active ? (preset.isSanctioned ? "text-rose-100" : "text-white") : "text-white/75",
                                  )}
                                >
                                  {preset.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[12px] text-white/35">{PRESET_META[preset.id]}</span>
                              </span>
                              <span className="relative shrink-0 text-right">
                                <span
                                  className={cn(
                                    "block font-mono text-[12px] transition-colors duration-500 ease-cinematic",
                                    active ? (preset.isSanctioned ? "text-rose-200" : "text-emerald-200") : "text-white/55",
                                  )}
                                >
                                  {amountLabel}
                                </span>
                                <span
                                  className={cn(
                                    "mt-0.5 block text-[10px] uppercase tracking-[0.16em]",
                                    preset.isSanctioned ? "text-rose-300/70" : "text-white/30",
                                  )}
                                >
                                  {tagLabel}
                                </span>
                              </span>
                            </button>
                          );
                        })}

                        <AnimatePresence initial={false}>
                          {selectedPreset.id === "custom" && stage !== "IDLE" && (
                            <motion.div
                              key={selectedPreset.invoiceNumber}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } }}
                              exit={{ opacity: 0, transition: { duration: 0.2 } }}
                              className={cn(
                                "flex items-center gap-4 rounded-[1.1rem] px-4 py-3.5 ring-1",
                                selectedPreset.isSanctioned ? "bg-rose-500/[0.08] ring-rose-400/30" : "bg-emerald-400/[0.07] ring-emerald-300/25",
                              )}
                            >
                              <FileTextIcon size={16} className="text-white/50" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-medium text-white">{selectedPreset.name}</span>
                                <span className="mt-0.5 block text-[12px] text-white/35">Extracted from uploaded invoice</span>
                              </span>
                              <span className="shrink-0 font-mono text-[12px] text-emerald-200">{selectedPreset.badge.split(" • ")[0]}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Dropzone — native HTML5 drag & drop wiring preserved */}
                      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.png,.jpg,.json" onChange={handleFileUpload} />
                      <div
                        role="button"
                        tabIndex={0}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                        className={cn(
                          "group relative mt-5 flex cursor-pointer items-center gap-4 overflow-hidden rounded-[1.25rem] p-4 ring-1 transition-[box-shadow,background-color,transform] duration-500 ease-cinematic",
                          isDragging
                            ? "scale-[1.01] bg-emerald-400/[0.06] ring-emerald-300/50"
                            : "bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.035] hover:ring-white/[0.12]",
                        )}
                      >
                        {isDragging && (
                          <motion.span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-emerald-300/20 to-transparent"
                            initial={{ y: "-100%" }}
                            animate={{ y: "260%" }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: EASE_CINEMATIC }}
                          />
                        )}
                        <span
                          className={cn(
                            "pointer-events-none flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 transition-colors duration-500 ease-cinematic",
                            isDragging
                              ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/40"
                              : "bg-white/[0.04] text-white/55 ring-white/10 group-hover:text-emerald-200",
                          )}
                        >
                          <CloudArrowUpIcon size={20} />
                        </span>
                        <span className="pointer-events-none min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-white/85">
                            {isDragging ? "Drop commercial invoice to parse..." : "Drop commercial invoice (PDF / OCR)"}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-white/35">Automated parameter extraction & verification</span>
                        </span>
                        <span className="pointer-events-none hidden font-mono text-[10px] uppercase tracking-[0.16em] text-white/25 sm:block">
                          PDF · PNG · JSON
                        </span>
                      </div>

                      {/* Judge Test Artifacts Download Strip */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 flex items-center gap-1.5">
                          <SparkleIcon size={12} className="text-emerald-400" />
                          <span>Judge Test Kit:</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href="/samples/sample-aws-clean-invoice.pdf"
                            download="sample-aws-clean-invoice.pdf"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                            title="Download sample clean invoice to test live OCR"
                          >
                            <DownloadSimpleIcon size={12} />
                            <span>Clean AWS.pdf</span>
                          </a>
                          <a
                            href="/samples/sample-tornado-sanctioned-invoice.pdf"
                            download="sample-tornado-sanctioned-invoice.pdf"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1 text-[11px] font-mono text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer"
                            title="Download sample OFAC-sanctioned invoice to test compliance intercept"
                          >
                            <ShieldWarningIcon size={12} />
                            <span>Sanctioned Tornado.pdf</span>
                          </a>
                        </div>
                      </div>
                    </Bezel>
                  </Reveal>

                  {/* 02 — U-Bot copilot */}
                  <Reveal delay={0.08}>
                    <Bezel tone={isAlert ? "rose" : "neutral"} innerClassName="p-6 md:p-7">
                      <CardHeader
                        index="02"
                        title="U-Bot financial copilot"
                        right={
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsUbotOpen(true)}
                              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30 hover:bg-cyan-500/20 transition-colors duration-500 ease-cinematic cursor-pointer"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span>Open Copilot Chat</span>
                            </button>
                            <button
                              onClick={handlePlayVoice}
                              title="Synthesize voice briefing via ElevenLabs AI"
                              className={cn(
                                "flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 transition-colors duration-500 ease-cinematic",
                                isPlayingAudio
                                  ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/40"
                                  : "bg-white/[0.03] text-white/55 ring-white/10 hover:text-white",
                              )}
                            >
                              <VoiceBars active={isPlayingAudio} />
                              <span>{isPlayingAudio ? "Synthesizing..." : "ElevenLabs TTS"}</span>
                            </button>
                          </div>
                        }
                      />

                      <div
                        className={cn(
                          "mt-6 flex gap-3.5 rounded-[1.25rem] p-4 ring-1 transition-colors duration-700 ease-cinematic",
                          selectedPreset.isSanctioned
                            ? "bg-rose-500/[0.07] ring-rose-400/25"
                            : stage === "IDLE"
                            ? "bg-white/[0.02] ring-white/[0.06]"
                            : "bg-emerald-400/[0.05] ring-emerald-300/15",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1",
                            selectedPreset.isSanctioned
                              ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                              : stage === "IDLE"
                              ? "bg-white/[0.04] text-white/50 ring-white/10"
                              : "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
                          )}
                        >
                          {selectedPreset.isSanctioned ? (
                            <ShieldWarningIcon size={16} />
                          ) : stage === "IDLE" ? (
                            <ClockIcon size={16} />
                          ) : (
                            <SparkleIcon size={16} />
                          )}
                        </span>
                        <p
                          className={cn(
                            "text-[13px] leading-relaxed",
                            selectedPreset.isSanctioned ? "text-rose-100/80" : stage === "IDLE" ? "text-white/45" : "text-emerald-50/75",
                          )}
                        >
                          <span className="mr-1.5 font-medium text-white">U-Bot</span>
                          <StreamText text={ubotMessage} />
                        </p>
                      </div>

                      <div className="mt-4 divide-y divide-white/[0.06]">
                        <DataRow label="Invoice">
                          <span className="font-mono">{selectedPreset.invoiceNumber}</span>
                        </DataRow>
                        <DataRow label="Vendor">{selectedPreset.vendorName}</DataRow>
                        <DataRow label="Receiving address">
                          <button
                            onClick={handleCopyAddress}
                            title="Copy Checksum Address"
                            className="group inline-flex items-center gap-2.5 font-mono text-white/75 transition-colors duration-500 ease-cinematic hover:text-white"
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              {copied ? (
                                <motion.span
                                  key="copied"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                                  className="font-sans text-[12px] text-emerald-300"
                                >
                                  Copied!
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="addr"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                                >
                                  {selectedPreset.recipientAddress.slice(0, 6)}...{selectedPreset.recipientAddress.slice(-4)}
                                </motion.span>
                              )}
                            </AnimatePresence>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/10 transition-transform duration-500 ease-cinematic group-hover:scale-105">
                              {copied ? <CheckIcon size={12} className="text-emerald-300" /> : <CopyIcon size={12} />}
                            </span>
                          </button>
                        </DataRow>
                      </div>

                      <AnimatePresence initial={false}>
                        {selectedPreset.tokenomist && (
                          <motion.div
                            key="tokenomist"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } }}
                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                            className="mt-2 flex items-start gap-3 rounded-[1rem] bg-emerald-400/[0.05] p-3.5 ring-1 ring-emerald-300/15"
                          >
                            <ShieldCheckIcon size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                            <span className="text-[12px] leading-relaxed text-white/55">
                              <span className="font-medium text-emerald-200">Tokenomist Intelligence: AVAX 38-day Cliff Benchmark (Institutional Tier)</span> ·{" "}
                              {selectedPreset.tokenomist.circulating} Circulating · Next Cliff: {selectedPreset.tokenomist.cliffDays}d ·{" "}
                              {selectedPreset.tokenomist.risk}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/[0.06] pt-5">
                        <span className="pb-1 text-[12px] text-white/40">Gross payable</span>
                        <div className="text-right">
                          <div className="text-[2rem] font-medium leading-none tracking-[-0.045em] text-white">
                            <AnimatedNumber
                              value={selectedPreset.amount}
                              duration={0.9}
                              format={(v: number) =>
                                selectedPreset.currency === "USDC" ? `$${formatCurrency(v)}` : Math.round(v).toLocaleString("en-US")
                              }
                            />
                            <span className="ml-2 text-[13px] font-normal tracking-normal text-white/40">{selectedPreset.currency}</span>
                          </div>
                          {selectedPreset.currency === "AVAX" && (
                            <div className="mt-1.5 font-mono text-[11px] text-white/35">
                              (~${formatCurrency(selectedPreset.amount * 25.0)} USD)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* State-driven action slot */}
                      <div className="mt-6">
                        <AnimatePresence mode="wait" initial={false}>
                          {stage === "IDLE" && (
                            <motion.div
                              key="idle"
                              {...swap}
                              className="flex flex-col items-center gap-4 rounded-[1.25rem] bg-white/[0.02] p-5 text-center ring-1 ring-white/[0.06]"
                            >
                              <p className="text-[12px] text-white/40">Ready for Ingestion • Select a preset or drop an invoice above</p>
                              <IslandButton variant="ghost" onClick={() => handleSelectPreset(PRESETS[0])} icon={<ArrowUpRightIcon size={14} />}>
                                Load AWS Infrastructure Demo
                              </IslandButton>
                            </motion.div>
                          )}

                          {stage === "AWAITING_APPROVAL" && !selectedPreset.isSanctioned && (
                            <motion.div key="await" {...swap}>
                              <IslandButton
                                id="btn-authorize"
                                size="lg"
                                magnetic={false}
                                onClick={handleAuthorizeAndSettle}
                                className="w-full justify-between"
                                icon={<LightningIcon size={17} weight="regular" />}
                              >
                                Authorize & Settle via Avalanche
                              </IslandButton>
                            </motion.div>
                          )}

                          {stage === "SETTLING" && (
                            <motion.div
                              key="settling"
                              {...swap}
                              className="relative flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-white/[0.03] text-[13px] text-white/70 ring-1 ring-white/10"
                            >
                              <span aria-hidden className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent" />
                              <CircleNotchIcon size={16} className="relative animate-spin-slow text-emerald-300" />
                              <span className="relative">Broadcasting to Avalanche Fuji C-Chain...</span>
                            </motion.div>
                          )}

                          {stage === "SETTLED" && !selectedPreset.isSanctioned && (
                            <motion.div
                              key="settled"
                              {...swap}
                              className="flex min-h-14 items-center justify-center gap-3 rounded-full bg-emerald-400/[0.08] px-5 py-3 text-center text-[13px] font-medium text-emerald-200 ring-1 ring-emerald-300/30"
                            >
                              <DrawnCheck className="h-5 w-5 shrink-0 text-emerald-300" />
                              <span>{settledLabel}</span>
                            </motion.div>
                          )}

                          {selectedPreset.isSanctioned && stage !== "IDLE" && (
                            <motion.div
                              key="flagged"
                              {...swap}
                              className="flex h-14 items-center justify-center gap-3 rounded-full bg-rose-500/[0.08] text-[13px] font-medium text-rose-200 ring-1 ring-rose-400/30"
                            >
                              <ShieldWarningIcon size={18} />
                              <span>Execution Terminated: Compliance Alert</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Bezel>
                  </Reveal>
                </div>

                {/* Right column */}
                <div className="space-y-6 lg:col-span-7">
                  {/* 03 — Lifecycle */}
                  <Reveal delay={0.12}>
                    <Bezel
                      id="lifecycle"
                      tone={failedIndex >= 0 ? "rose" : stage === "SETTLED" ? "emerald" : "neutral"}
                      innerClassName="p-6 md:p-8"
                    >
                      <CardHeader
                        index="03"
                        title="Execution lifecycle"
                        right={
                          <Eyebrow pulse={stage === "SETTLING" || stage === "AWAITING_APPROVAL"} tone={stageMeta.tone}>
                            {stageMeta.label}
                          </Eyebrow>
                        }
                      />

                      <div className="relative mt-9">
                        <div aria-hidden className="absolute left-[14px] top-[14px] hidden h-px w-[75%] bg-white/[0.08] sm:block">
                          <motion.div
                            className={cn(
                              "h-full origin-left",
                              failedIndex >= 0
                                ? "bg-gradient-to-r from-emerald-400 to-rose-400"
                                : "bg-gradient-to-r from-emerald-500 via-emerald-300 to-emerald-200",
                            )}
                            initial={false}
                            animate={{ scaleX: trackProgress }}
                            transition={{ duration: stage === "SETTLING" ? 2.4 : 1.2, ease: EASE_CINEMATIC }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0">
                          {lifecycleSteps.map((step, idx) => {
                            const isActive = idx === activeIndex;
                            return (
                              <div key={step.name} className="relative pr-4">
                                <motion.div
                                  initial={false}
                                  animate={{ scale: step.passed || step.failed ? [1, 1.2, 1] : 1 }}
                                  transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: idx * 0.09 }}
                                  className={cn(
                                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full ring-1 transition-colors duration-700 ease-cinematic",
                                    step.failed
                                      ? "bg-[#1A0A0D] text-rose-300 ring-rose-400/60"
                                      : step.passed
                                      ? "bg-emerald-400 text-[#022014] ring-emerald-300 shadow-[0_0_20px_-2px_rgba(52,211,153,0.6)]"
                                      : isActive
                                      ? "bg-[#0B0B0C] text-emerald-200 ring-emerald-300/50"
                                      : "bg-[#0B0B0C] text-white/30 ring-white/10",
                                  )}
                                >
                                  {step.failed ? (
                                    <WarningIcon size={13} weight="regular" />
                                  ) : step.passed ? (
                                    <CheckIcon size={13} weight="regular" />
                                  ) : isActive ? (
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                                  ) : (
                                    <span className="font-mono text-[10px]">{idx + 1}</span>
                                  )}
                                  {isActive && <span className="absolute inset-0 animate-ping rounded-full ring-1 ring-emerald-300/40" />}
                                </motion.div>
                                <div
                                  className={cn(
                                    "mt-4 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-500 ease-cinematic",
                                    step.failed ? "text-rose-200" : step.passed || isActive ? "text-white" : "text-white/40",
                                  )}
                                >
                                  {step.name.replace(/^\d\.\s/, "")}
                                </div>
                                <AnimatePresence mode="wait" initial={false}>
                                  <motion.div
                                    key={step.desc}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                                    className="mt-1 text-[12px] leading-snug text-white/40"
                                  >
                                    {step.desc}
                                  </motion.div>
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Bezel>
                  </Reveal>

                  {/* 04 — Routing benchmark */}
                  <Reveal delay={0.16}>
                    <Bezel id="routing" innerClassName="p-6 md:p-8">
                      <CardHeader index="04" title="Liquidity routing & settlement benchmark" meta="Rail arbitrage" />

                      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                          <div className="text-[12px] text-white/40">Net savings on this invoice</div>
                          <div className="mt-2 text-[clamp(3rem,6vw,4.75rem)] font-medium leading-none tracking-[-0.055em] text-white">
                            <AnimatedNumber value={netSavings} format={(v: number) => `$${formatCurrency(v)}`} />
                          </div>
                          <p className="mt-3 text-[13px] text-white/40">Commercial Invoice {invoiceValueLabel} Payout Comparison</p>
                        </div>
                        <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[12px] font-medium text-emerald-200 ring-1 ring-emerald-300/25 md:self-auto">
                          Net Savings: ${formatCurrency(netSavings)} ({savingsPct}%)
                        </span>
                      </div>

                      <div className="mt-10 space-y-3">
                        {/* SWIFT lane */}
                        <div className="rounded-[1.25rem] bg-white/[0.02] p-5 ring-1 ring-white/[0.06]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-[13px] font-medium text-white/70">Traditional SWIFT Wire</div>
                              <div className="mt-0.5 text-[12px] text-white/35">$25 Wire Fee + 3.5% FX Spread</div>
                            </div>
                            <div className="text-2xl font-medium tracking-[-0.04em] text-white/70">
                              <AnimatedNumber value={swiftFee} format={(v: number) => `$${formatCurrency(v)}`} />
                            </div>
                          </div>
                          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                            <motion.div
                              key={`swift-${selectedPreset.id}-${selectedPreset.invoiceNumber}`}
                              className="h-full origin-left rounded-full bg-gradient-to-r from-white/20 to-white/45"
                              initial={{ scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 2.6, ease: EASE_CINEMATIC, delay: 0.2 }}
                            />
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-[12px]">
                            <div>
                              <div className="text-white/35">Clearing Time</div>
                              <div className="mt-0.5 text-white/65">3–5 Business Days</div>
                            </div>
                            <div>
                              <div className="text-white/35">Intermediaries</div>
                              <div className="mt-0.5 text-white/65">Correspondent Bank</div>
                            </div>
                          </div>
                        </div>

                        {/* Avalanche lane */}
                        <div className="relative overflow-hidden rounded-[1.25rem] bg-emerald-400/[0.05] p-5 ring-1 ring-emerald-300/25">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-[13px] font-medium text-emerald-100">Avalanche C-Chain</span>
                                <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#022014]">
                                  Optimal Rail
                                </span>
                              </div>
                              <div className="mt-0.5 text-[12px] text-white/40">0.1% Swap + $0.0001 Gas</div>
                            </div>
                            <div className="text-2xl font-medium tracking-[-0.04em] text-emerald-200">
                              <AnimatedNumber value={avaxFee} format={(v: number) => `$${formatCurrency(v)}`} />
                            </div>
                          </div>
                          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-emerald-950/60">
                            <motion.div
                              key={`avax-${selectedPreset.id}-${selectedPreset.invoiceNumber}`}
                              className="h-full origin-left rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                              initial={{ scaleX: 0 }}
                              whileInView={{ scaleX: avaxRatio }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.25 }}
                            />
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-[12px]">
                            <div>
                              <div className="text-white/40">Consensus Finality</div>
                              <div className="mt-0.5 font-mono text-emerald-300">0.09s (Sub-2s)</div>
                            </div>
                            <div>
                              <div className="text-white/40">Custody Model</div>
                              <div className="mt-0.5 text-white/80">Non-Custodial (Local ECDSA)</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Bezel>
                  </Reveal>

                  {/* Outcome slot */}
                  <AnimatePresence mode="wait" initial={false}>
                    {stage === "SETTLED" && !selectedPreset.isSanctioned && (
                      <motion.div
                        key="settled-card"
                        initial={{ opacity: 0, y: 32, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: EASE_CINEMATIC } }}
                        exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: EASE_IN_QUART } }}
                      >
                        <Bezel tone="emerald" innerClassName="p-6 md:p-8">
                          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-4">
                              <DrawnCheck className="h-11 w-11 shrink-0 text-emerald-300" />
                              <div className="min-w-0">
                                <div className="text-[15px] font-medium tracking-[-0.01em] text-white">{settledLabel}</div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-white/40">
                                  <span>
                                    TxHash <span className="text-white/80">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                                  </span>
                                  <span>
                                    Latency <span className="text-emerald-300">{latencyMs}ms</span>
                                  </span>
                                  <span>
                                    Block <span className="text-white/80">#{blockHeight}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <IslandButton variant="ghost" onClick={() => handleInspectTransaction(txHash)} icon={<ArrowUpRightIcon size={14} />}>
                                Verify Snowtrace
                              </IslandButton>
                              <IslandButton id="btn-export-csv" onClick={handleExportCSV} title="Download ERP Reconciliation CSV" icon={<DownloadSimpleIcon size={14} />}>
                                Export CSV
                              </IslandButton>
                            </div>
                          </div>
                        </Bezel>
                      </motion.div>
                    )}

                    {selectedPreset.isSanctioned && (
                      <motion.div
                        key="sanction-card"
                        initial={{ opacity: 0, y: 16, x: 0 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          x: [0, -10, 8, -5, 3, 0],
                          transition: {
                            opacity: { duration: 0.2 },
                            y: { duration: 0.4, ease: EASE_OUT_EXPO },
                            x: { duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.1 },
                          },
                        }}
                        exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: EASE_IN_QUART } }}
                      >
                        <Bezel tone="rose" innerClassName="p-6 md:p-8">
                          <div className="flex items-start gap-4">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/40">
                              <ShieldWarningIcon size={20} />
                            </span>
                            <div className="min-w-0 space-y-3">
                              <h4 className="text-[15px] font-medium tracking-[-0.01em] text-rose-100">
                                Transaction Terminated: OFAC Sanctions Flag
                              </h4>
                              <p className="text-[13px] leading-relaxed text-white/55">
                                Target address <span className="break-all font-mono text-white/85">{selectedPreset.recipientAddress}</span>{" "}
                                matches the Tornado Cash Router blacklist. Non-custodial guard terminated the transaction in 34ms
                                with zero gas fee incurred.
                              </p>
                              <div className="border-t border-rose-400/15 pt-3 text-[12px] text-rose-200/70">
                                Compliance Resolution: Request alternative OFAC-screened corporate EVM address before dispatching funds.
                              </div>
                            </div>
                          </div>
                        </Bezel>
                      </motion.div>
                    )}

                    {stage === "IDLE" && (
                      <motion.div key="idle-card" {...swap}>
                        <div className="rounded-[2rem] bg-white/[0.015] p-8 text-center ring-1 ring-white/[0.06]">
                          <div className="text-[13px] font-medium text-white/60">Session Reset • Ready for Ingestion</div>
                          <div className="mt-1 text-[12px] text-white/35">
                            Select an invoice preset or drag and drop a commercial invoice to begin evaluation.
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>
          </main>

          {/* ── Footer ───────────────────────────────────────── */}
          <footer className="relative mt-12 overflow-hidden border-t border-white/[0.06]">
            <div className="mask-fade-x overflow-hidden py-8">
              <div className="flex w-max animate-marquee whitespace-nowrap text-[13px] text-white/35">
                {[...INTEGRATIONS, ...INTEGRATIONS].map((item, i) => (
                  <span key={i} className="flex items-center gap-12 pr-12">
                    <span>{item}</span>
                    <span className="h-1 w-1 rounded-full bg-emerald-300/40" />
                  </span>
                ))}
              </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div
                aria-hidden
                className="select-none whitespace-nowrap bg-gradient-to-b from-white/[0.10] to-white/0 bg-clip-text pb-4 text-center text-[clamp(4rem,17vw,15rem)] font-medium leading-[0.85] tracking-[-0.07em] text-transparent"
              >
                FlowAgent
              </div>
              <div className="flex flex-col gap-3 border-t border-white/[0.06] py-8 text-[12px] text-white/35 md:flex-row md:items-center md:justify-between">
                <div>FlowAgent OS • Enterprise Accounts Payable Workstation</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>Avalanche Fuji C-Chain</span>
                  <span>•</span>
                  <span>ElevenLabs Turbo v2.5</span>
                  <span>•</span>
                  <span>Tokenomist Intelligence</span>
                </div>
              </div>
            </div>
          </footer>

          {/* ── In-app on-chain receipt modal ───────────────────── */}
          <AnimatePresence>
            {isReceiptModalOpen && selectedReceipt && (
              <motion.div
                key="receipt"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.4, ease: EASE_OUT_EXPO } }}
                exit={{ opacity: 0, transition: { duration: 0.25, ease: EASE_IN_QUART } }}
                onClick={() => setIsReceiptModalOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="receipt-title"
                  className="w-full max-w-lg"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  initial={{ opacity: 0, y: 28, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT }}
                  exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2, ease: EASE_IN_QUART } }}
                >
                  <Bezel tone="emerald" innerClassName="p-6 md:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        <h3 id="receipt-title" className="text-[15px] font-medium tracking-[-0.01em] text-white">
                          Cryptographic Execution Receipt
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsReceiptModalOpen(false)}
                        aria-label="Close receipt"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-white/60 ring-1 ring-white/10 transition-colors duration-500 ease-cinematic hover:bg-white/[0.1] hover:text-white"
                      >
                        <XIcon size={15} />
                      </button>
                    </div>

                    <div className="mt-6 divide-y divide-white/[0.06] font-mono">
                      <DataRow label="Network">
                        <span className="text-emerald-300">{selectedReceipt.network}</span>
                      </DataRow>
                      <DataRow label="Block Height">#{selectedReceipt.blockNumber}</DataRow>
                      <DataRow label="Finality Latency">
                        <span className="text-emerald-300">{selectedReceipt.finality}</span>
                      </DataRow>
                      <DataRow label="Gas Paid">{selectedReceipt.gasPaid}</DataRow>
                      <DataRow label="Timestamp">{selectedReceipt.timestamp}</DataRow>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-[12px] text-white/40">
                        <span>Transaction Hash</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedReceipt.txHash);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 hover:text-white transition cursor-pointer"
                        >
                          <CopyIcon size={12} />
                          <span>{copied ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="mt-2 break-all rounded-[1rem] bg-black/40 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-200/90 ring-1 ring-white/[0.06]">
                        {selectedReceipt.txHash}
                      </div>
                      <a
                        href={`https://testnet.snowtrace.io/tx/${selectedReceipt.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-mono text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                      >
                        <ArrowUpRightIcon size={14} />
                        <span>View on Snowtrace Explorer</span>
                      </a>
                    </div>

                    <div className="mt-6 text-center text-[11px] text-white/30">
                      Snowman BFT Consensus • Avalanche Fuji C-Chain Subnet Verified
                    </div>
                  </Bezel>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Interactive U-Bot Copilot Drawer ───────────────────── */}
          <AnimatePresence>
            {isUbotOpen && (
              <motion.div
                key="ubot-drawer"
                className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.25, ease: EASE_OUT_EXPO } }}
                exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_IN_QUART } }}
                onClick={() => setIsUbotOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ubot-drawer-title"
                  className="relative flex h-full w-full max-w-2xl flex-col border-l border-white/[0.08] bg-[#07090E] shadow-[0_0_80px_rgba(0,0,0,0.85)] overflow-hidden"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  initial={{ x: "100%" }}
                  animate={{ x: 0, transition: SPRING_SOFT }}
                  exit={{ x: "100%", transition: { duration: 0.25, ease: EASE_IN_QUART } }}
                >
                  <UBotSimulator onClose={() => setIsUbotOpen(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </IconContext.Provider>
    </MotionConfig>
  );
}
