import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Terminal,
  BarChart3,
  Presentation,
  Github,
  ExternalLink,
} from 'lucide-react';

export interface PresenterHudStatus {
  fallbackActive: boolean;
  fallbackLabel: string;
  rpcNode: string;
  rpcLabel: string;
  rpcLatencyMs?: number;
  voiceState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  voiceLabel: string;
  isVoiceReady: boolean;
  tokenomistActive?: boolean;
  tokenomistLabel?: string;
  blockNumber?: number | string;
  walletBalanceAvax?: string | number;
  walletBalanceUsdc?: string | number;
}

interface NavbarProps {
  apiBaseUrl?: string;
  blockHeight?: number | string;
  onPanicToggle?: (active: boolean) => void;
  onAudioUnlocked?: () => void;
}

function playHapticVoiceChirp() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch (err) {
    console.warn('AudioContext initialization note:', err);
  }
}

export const Navbar: React.FC<NavbarProps> = ({
  apiBaseUrl = '',
  blockHeight,
  onPanicToggle,
  onAudioUnlocked,
}) => {
  const [hud, setHud] = useState<PresenterHudStatus>({
    fallbackActive: false,
    fallbackLabel: 'LIVE ON-CHAIN',
    rpcNode: 'Official Fuji',
    rpcLabel: 'Fuji C-Chain',
    rpcLatencyMs: 220,
    voiceState: 'CLOSED',
    voiceLabel: 'ElevenLabs: Ready',
    isVoiceReady: true,
    blockNumber: blockHeight || 59490095,
    walletBalanceAvax: '0.00',
    walletBalanceUsdc: '0.00',
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; isWarning: boolean } | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (blockHeight) {
      setHud((prev) => ({ ...prev, blockNumber: blockHeight }));
    }
  }, [blockHeight]);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/admin/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          setHud((prev) => ({
            ...prev,
            fallbackActive: data.fallback?.active ?? false,
            fallbackLabel: data.fallback?.active ? 'OFFLINE CACHE (PANIC ACTIVE)' : 'LIVE ON-CHAIN',
            rpcNode: data.rpc?.activeNode ?? 'Official Fuji',
            rpcLabel: data.rpc?.label ?? 'Fuji C-Chain',
            rpcLatencyMs: data.rpc?.latencyMs ?? prev.rpcLatencyMs,
            voiceState: data.voice?.state ?? 'CLOSED',
            voiceLabel: data.voice?.label ?? 'ElevenLabs: Ready',
            isVoiceReady: data.voice?.isReady ?? true,
            tokenomistActive: data.tokenomist?.active ?? true,
            tokenomistLabel: data.tokenomist?.label ?? 'Tokenomist: Ready',
            walletBalanceAvax: data.wallet?.avaxBalance ?? prev.walletBalanceAvax,
            walletBalanceUsdc: data.wallet?.usdcBalance ?? prev.walletBalanceUsdc,
          }));
        }
      } catch {
        // Fallback remains stable
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiBaseUrl]);

  const triggerPanicToggle = async (forcedState?: boolean) => {
    try {
      const targetState = forcedState !== undefined ? forcedState : !hud.fallbackActive;
      const res = await fetch(`${apiBaseUrl}/api/admin/toggle-fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState }),
      });
      const data = await res.json();
      if (data.success) {
        setHud((prev) => ({
          ...prev,
          fallbackActive: data.fallbackActive,
          fallbackLabel: data.fallbackActive ? 'OFFLINE CACHE (PANIC ACTIVE)' : 'LIVE ON-CHAIN',
        }));

        if (data.fallbackActive) {
          showFloatingToast('Stage Panic Activated: Operating in Zero-Downtime Offline Cache Mode', true);
        } else {
          showFloatingToast('Live Avalanche Fuji On-Chain Settlement Restored', false);
        }

        if (onPanicToggle) onPanicToggle(data.fallbackActive);
      }
    } catch {
      showFloatingToast('Stage Panic Switch: Communication Error', true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        triggerPanicToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hud.fallbackActive]);

  const handleBadgeClick = () => {
    clickCountRef.current++;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      triggerPanicToggle();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 700);
    }
  };

  const showFloatingToast = (text: string, isWarning: boolean) => {
    setToastMessage({ text, isWarning });
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleUnmuteClick = () => {
    playHapticVoiceChirp();
    setIsAudioUnlocked(true);
    showFloatingToast('AudioContext Initialized: Voice Feedback Active', false);
    if (onAudioUnlocked) onAudioUnlocked();
  };

  return (
    <div data-ui="presenter-hud">
      {/* Floating Tactical Toast Banner */}
      {toastMessage && (
        <div
          role="alert"
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2.5 border ${
            toastMessage.isWarning
              ? 'bg-[#180505] border-hazard text-hazard'
              : 'bg-[#051810] border-phosphor-green text-phosphor-green'
          }`}
        >
          {toastMessage.isWarning ? (
            <AlertTriangle className="w-4 h-4 text-hazard shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-phosphor-green shrink-0" />
          )}
          <span className="tracking-wide font-sans">{toastMessage.text}</span>
        </div>
      )}

      {/* High-End Floating Presenter HUD */}
      <header className="sticky top-0 z-40 w-full px-4 lg:px-8 py-3 bg-[#05070D]">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="p-1.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-[#0A0F1D] flex items-center justify-center border border-cyan-500/30 text-phosphor-cyan">
                <Terminal className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white font-display uppercase flex items-center gap-1.5">
                  <span>FLOWAGENT</span>
                  <span className="text-phosphor-cyan">OS</span>
                </h1>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-300 font-bold font-sans">
                  AUTONOMOUS AP
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30 font-semibold hidden sm:inline font-sans">
                  v0.4.1 / FUJI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wider hidden sm:block uppercase font-sans">
                TACTICAL TELEMETRY / HITL SETTLEMENT RUNTIME
              </p>
            </div>

            {/* Quick Access Links: Pitch Deck & GitHub for Judges */}
            <div className="hidden lg:flex items-center gap-2 ml-2">
              <a
                href="/pitch_deck.html"
                target="_blank"
                rel="noopener noreferrer"
                title="View Pitch Deck (11 Slides) - Opens in new tab"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-950/60 to-purple-900/40 border border-violet-500/40 text-violet-200 hover:text-white hover:border-violet-400 transition-all shadow-[0_0_15px_rgba(167,139,250,0.15)]"
              >
                <Presentation className="w-3.5 h-3.5 text-violet-400" />
                <span>Pitch Deck</span>
                <ExternalLink className="w-3 h-3 text-violet-400/70" />
              </a>

              <a
                href="https://github.com/pxpickkyyy/flowagent-os"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Public GitHub Repository"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all"
              >
                <Github className="w-3.5 h-3.5 text-white/80" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-white/40" />
              </a>
            </div>
          </div>

          {/* Presenter Telemetry Pods */}
          <div className="flex flex-wrap items-center gap-2 text-xs select-none">
            {/* RPC Node & Latency */}
            <div
              title={`RPC: ${hud.rpcNode} (${hud.rpcLatencyMs}ms)`}
              className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-phosphor-green" />
              <span className="text-slate-400 text-[11px] uppercase hidden md:inline font-sans">RPC:</span>
              <span className="font-bold text-white text-[11px] tracking-tight font-sans">{hud.rpcNode}</span>
              <samp className="text-[10px] font-bold text-phosphor-green bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono">
                {hud.rpcLatencyMs}ms
              </samp>
            </div>

            {/* Block Height Counter */}
            <div
              title="Avalanche Fuji Block Height"
              className="flex items-center gap-1.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 px-3 py-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-phosphor-cyan" />
              <span className="text-slate-400 text-[11px] uppercase hidden sm:inline font-sans">BLK:</span>
              <samp className="font-extrabold text-phosphor-cyan text-xs font-mono">
                #{hud.blockNumber}
              </samp>
            </div>

            {/* Tokenomist Vesting & Cliff Intelligence Pod */}
            <div
              title="Tokenomist: AVAX Token Unlock & Vesting Schedule (38d to next cliff)"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 px-3 py-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 text-[11px] uppercase hidden md:inline font-sans">TOKENOMIST:</span>
              <samp className="font-extrabold text-indigo-300 text-xs font-mono">
                CLIFF 38d
              </samp>
            </div>

            {/* Audio Voice Unmute Trigger */}
            <button
              type="button"
              onClick={handleUnmuteClick}
              title="Click to Test or Unmute Voice Feedback and initialize browser AudioContext"
              className={`group flex items-center gap-2 rounded-xl px-3 py-1.5 font-bold btn-island cursor-pointer border ${
                isAudioUnlocked
                  ? 'border-cyan-500/40 bg-cyan-950/40 text-phosphor-cyan'
                  : 'border-amber-500/60 bg-amber-950/50 text-amber-300'
              }`}
            >
              <span className="text-[11px] uppercase hidden lg:inline font-sans">
                {hud.voiceLabel}
              </span>
              <div className="btn-icon-wrapper w-5 h-5 rounded-lg bg-black/50 border border-current flex items-center justify-center">
                <Volume2 className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-extrabold uppercase font-sans">
                {isAudioUnlocked ? 'ONLINE' : 'UNMUTE'}
              </span>
            </button>

            {/* Emergency Stage Panic Switch */}
            <button
              type="button"
              onClick={handleBadgeClick}
              title="STAGE PANIC SWITCH: Click 3x or press Ctrl+Shift+F to toggle zero-downtime offline cache"
              className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 font-bold btn-island cursor-pointer ${
                hud.fallbackActive
                  ? 'border-hazard bg-hazard-dark/60 text-white hazard-stripes'
                  : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-emerald-500/50 hover:text-white'
              }`}
            >
              <div className="btn-icon-wrapper w-5 h-5 rounded-lg bg-black/60 border border-current flex items-center justify-center">
                <ShieldAlert className={`w-3 h-3 ${hud.fallbackActive ? 'text-white' : 'text-phosphor-green'}`} />
              </div>
              <span className="text-[11px] uppercase font-sans">
                {hud.fallbackActive ? 'PANIC ENGAGED' : 'LIVE ON-CHAIN'}
              </span>
              <samp className="text-[9px] text-slate-400 font-mono px-1 py-0.5 rounded bg-black/60 border border-white/10 hidden xl:inline">
                CTRL+SHIFT+F
              </samp>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
