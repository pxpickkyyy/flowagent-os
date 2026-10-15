import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Zap,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Paperclip,
  Loader2,
  AlertTriangle,
  Terminal,
  BarChart3,
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ComplianceErrorInfo } from './ActionableErrorModal';

export interface UbotCardPayload {
  type: string;
  version: string;
  title: string;
  subtitle?: string;
  status?: string;
  metrics?: Array<{ label: string; value: string; highlight?: boolean }>;
  actions?: Array<{ type: string; label: string; action?: string; url?: string }>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ubot';
  text: string;
  timestamp: string;
  card?: UbotCardPayload;
  audioUrl?: string;
  isApprovalCard?: boolean;
  isConfirmedCard?: boolean;
  isBlockedCard?: boolean;
  sessionId?: string;
  invoiceData?: {
    invoiceNumber: string;
    vendorName: string;
    amount: number;
    currency: string;
    dueDate?: string;
    recipientAddress?: string;
  };
  settlementData?: {
    txHash?: string;
    explorerUrl?: string;
    durationMs?: number;
    gasFeeUsd?: number;
    savingsUsd?: number;
  };
}

interface UBotSimulatorProps {
  apiBaseUrl?: string;
  onInspectCompliance?: (error: ComplianceErrorInfo) => void;
  onInvoiceActionDispatched?: () => void;
  onClose?: () => void;
}

export const UBotSimulator: React.FC<UBotSimulatorProps> = ({
  apiBaseUrl = '',
  onInspectCompliance,
  onInvoiceActionDispatched,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ubot',
      text: "Welcome to FlowAgent OS. I am U-Bot, your autonomous accounts payable copilot on Avalanche Fuji C-Chain (Chain ID: 43113).\n\nAsk any question, pick a Quick Docket below, or drop an invoice PDF to inspect zero-lag OCR extraction, sub-1ms OFAC sanctions screening, and sub-second settlement.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const playAudio = (url: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (currentlyPlayingAudio === url) {
        setCurrentlyPlayingAudio(null);
        return;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      setCurrentlyPlayingAudio(url);

      audio.onended = () => {
        setCurrentlyPlayingAudio(null);
      };
      audio.onerror = () => {
        setCurrentlyPlayingAudio(null);
      };

      audio.play().catch((err) => {
        console.warn('Autoplay note: user gesture required by browser:', err);
        setCurrentlyPlayingAudio(null);
      });
    } catch (err) {
      console.warn('Audio play exception:', err);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlayingAudio(null);
    }
  };

  const handleExportReconciliationCSV = (msg: ChatMessage) => {
    const invoiceNum = msg.invoiceData?.invoiceNumber || 'INV-2026-AWS';
    const vendor = msg.invoiceData?.vendorName || 'Amazon Web Services';
    const rail = 'Avalanche Fuji C-Chain (43113)';
    const txHash = msg.settlementData?.txHash || '0x5949...88fc';
    const durationSec = ((msg.settlementData?.durationMs || 1240) / 1000).toFixed(2);
    const gasFeeUSD = (msg.settlementData?.gasFeeUsd || 2.54).toFixed(2);
    const savingsUSD = (msg.settlementData?.savingsUsd || 109.96).toFixed(2);
    const timestamp = new Date().toISOString();

    const csvContent =
      'InvoiceNumber,Vendor,SettlementRail,TxHash,DurationSeconds,GasFeeUSD,SavingsUSD,Timestamp,ReconciliationStatus\n' +
      `"${invoiceNum}","${vendor}","${rail}","${txHash}",${durationSec},${gasFeeUSD},${savingsUSD},"${timestamp}","RECONCILED_AUTOMATED"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FlowAgent_Reconciliation_${invoiceNum}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const dispatchMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (onInvoiceActionDispatched) onInvoiceActionDispatched();

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ubot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: 'driver_session',
          synthesizeVoice: true,
        }),
      });

      const data = await res.json();
      const currentSessId = data.sessionId;
      if (currentSessId) setActiveSessionId(currentSessId);

      if (res.status === 403 || data.stage === 'FLAGGED' || !data.success) {
        const errorInfo: ComplianceErrorInfo = {
          code: data.error?.code || 'OFAC_SANCTION_MATCH',
          message: data.error?.message || 'Compliance guard violation',
          flagReason: data.error?.flagReason || 'OFAC Sanctioned Entity: Tornado Cash',
          checkedAddress: data.error?.checkedAddress || '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc',
          vendorName: 'Tornado Cash Router',
          invoiceNumber: 'INV-SANCTION-001',
          actionableResolution: data.error?.actionableResolution,
          scanLatencyMs: 14,
        };

        const blockedMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'ubot',
          text: data.replyText || 'Transaction halted by Deterministic Compliance Guard: OFAC Sanctions match.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          card: data.ubotCardPayload,
          audioUrl: data.audioUrl,
          isBlockedCard: true,
          sessionId: currentSessId,
        };

        setMessages((prev) => [...prev, blockedMsg]);

        if (data.audioUrl) {
          playAudio(`${apiBaseUrl}${data.audioUrl}`);
        }

        if (onInspectCompliance) {
          onInspectCompliance(errorInfo);
        }
        return;
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'ubot',
        text: data.replyText || 'Processing complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        card: data.ubotCardPayload,
        audioUrl: data.audioUrl,
        isApprovalCard: data.ubotCardPayload?.actions?.some((a: any) => a.action === 'APPROVE_PAYMENT'),
        sessionId: currentSessId,
        invoiceData: data.invoice,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (data.audioUrl) {
        playAudio(`${apiBaseUrl}${data.audioUrl}`);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ubot',
          text: 'Communication error reaching `/api/ubot/message`. Ensure the backend server is running.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardAction = async (action: 'APPROVE_PAYMENT' | 'CANCEL_PAYMENT', sessId?: string) => {
    const targetSession = sessId || activeSessionId;
    if (!targetSession || isLoading) return;

    if (onInvoiceActionDispatched) onInvoiceActionDispatched();
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ubot/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSession,
          action,
        }),
      });

      const data = await res.json();

      if (action === 'CANCEL_PAYMENT') {
        const cancelMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'ubot',
          text: 'Payment cancelled by operator. Zero gas consumed and zero funds were broadcasted on-chain.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, cancelMsg]);
      } else if (action === 'APPROVE_PAYMENT') {
        const confirmedMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'ubot',
          text: data.replyText || 'Payment successfully settled on Avalanche Fuji C-Chain with cryptographic finality.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          card: data.ubotCardPayload,
          audioUrl: data.audioUrl,
          isConfirmedCard: true,
          sessionId: targetSession,
          invoiceData: {
            invoiceNumber: data.invoice?.invoiceNumber || 'INV-2026-AWS',
            vendorName: data.invoice?.vendorName || 'Amazon Web Services',
            amount: data.invoice?.amount || 2500,
            currency: 'USD',
          },
          settlementData: {
            txHash: data.settlement?.txHash,
            explorerUrl: data.settlement?.explorerUrl,
            durationMs: data.settlement?.latencyMs || 840,
            gasFeeUsd: 2.54,
            savingsUsd: 109.96,
          },
        };

        setMessages((prev) => [...prev, confirmedMsg]);

        if (data.audioUrl) {
          playAudio(`${apiBaseUrl}${data.audioUrl}`);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ubot',
          text: 'Action dispatch failed. Please check network connectivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onInvoiceActionDispatched) onInvoiceActionDispatched();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('invoice', file);
    formData.append('conversationId', 'upload_session');

    const uploadUserMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: `Uploaded Invoice: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, uploadUserMsg]);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ubot/message`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.sessionId) setActiveSessionId(data.sessionId);

      const botReply: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'ubot',
        text: data.replyText || 'Invoice uploaded and extracted successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        card: data.ubotCardPayload,
        audioUrl: data.audioUrl,
        isApprovalCard: data.ubotCardPayload?.actions?.some((a: any) => a.action === 'APPROVE_PAYMENT'),
        sessionId: data.sessionId,
        invoiceData: data.invoice,
      };
      setMessages((prev) => [...prev, botReply]);

      if (data.audioUrl) playAudio(`${apiBaseUrl}${data.audioUrl}`);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ubot',
          text: 'Failed to parse uploaded invoice file.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div data-ui="ubot-simulator" className="h-full flex flex-col bg-[#07090E] text-slate-100 font-sans selection:bg-cyan-500/20">
      {/* ── Single Unified Sleek Header ────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/[0.08] bg-[#0A0D15]/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/25 flex items-center justify-center text-cyan-300 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-white tracking-[-0.01em]">
                U-Bot Copilot
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-500/10 ring-1 ring-cyan-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Fuji 43113
              </span>
            </div>
            <p className="text-[11px] text-white/45">
              DeepSeek V4.1 Flash · ElevenLabs Turbo v2.5
            </p>
          </div>
        </div>

        {/* Audio state indicator & close button */}
        <div className="flex items-center gap-2">
          {currentlyPlayingAudio ? (
            <button
              onClick={stopAudio}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/30 text-cyan-200 text-[11px] font-medium transition hover:bg-cyan-500/25 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
              <span>Voice Playing</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-white/30 font-mono">
              <VolumeX className="w-3.5 h-3.5" />
              <span>Voice Ready</span>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 ring-1 ring-white/[0.08] hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Docket Pill Carousel ──────────────────────────── */}
      <div className="px-5 py-2.5 border-b border-white/[0.06] bg-[#080B12]/60 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
        <span className="text-[10px] uppercase font-mono tracking-wider text-white/35 shrink-0">
          Presets:
        </span>

        {/* 1. AWS Cloud */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => dispatchMessage('Pay AWS Invoice $2,500')}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-cyan-500/10 ring-1 ring-white/[0.08] hover:ring-cyan-500/30 text-white/80 hover:text-cyan-200 transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>AWS Cloud ($2.5k)</span>
          <Zap className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100" />
        </button>

        {/* 2. OFAC Tornado Cash */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => dispatchMessage('Test OFAC Sanctioned (Tornado Cash)')}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-rose-500/10 ring-1 ring-white/[0.08] hover:ring-rose-500/30 text-white/80 hover:text-rose-200 transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Tornado Cash (OFAC)</span>
          <ShieldAlert className="w-3 h-3 text-rose-400 opacity-60 group-hover:opacity-100" />
        </button>

        {/* 3. NodeOps Cloud */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => dispatchMessage('Pay NodeOps Cloud $850')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.08] ring-1 ring-white/[0.08] text-white/70 hover:text-white transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <span>NodeOps (850 AVAX)</span>
        </button>

        {/* 4. Tokenomist Vesting */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => dispatchMessage('Query AVAX Tokenomics & Unlock Schedule (Tokenomist)')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-indigo-500/10 ring-1 ring-white/[0.08] hover:ring-indigo-500/30 text-white/70 hover:text-indigo-200 transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <BarChart3 className="w-3 h-3 text-indigo-400" />
          <span>Tokenomist Vesting</span>
        </button>

        {/* 5. Status */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => dispatchMessage('Check wallet balance and network status')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.08] ring-1 ring-white/[0.08] text-white/70 hover:text-white transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <span>Status</span>
        </button>

        {/* Hidden File Input & Upload Pill */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.json,.txt"
          className="hidden"
        />

        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          title="Upload Custom Invoice PDF"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.08] ring-1 ring-white/[0.08] text-cyan-300 hover:text-cyan-200 transition-all shrink-0 cursor-pointer ml-auto disabled:opacity-50"
        >
          <Paperclip className="w-3 h-3 text-cyan-400" />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* ── Chat Messages Stream ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 text-[13px] leading-relaxed">
        {messages.map((msg) => {
          const isBot = msg.sender === 'ubot';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-400/25 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] ${
                  isBot
                    ? 'rounded-2xl rounded-tl-sm bg-white/[0.03] ring-1 ring-white/[0.07] p-4 text-white/90'
                    : 'rounded-2xl rounded-tr-sm bg-white/[0.08] ring-1 ring-white/[0.14] p-3.5 text-white ml-auto'
                }`}
              >
                {/* Micro sender line & timestamp */}
                <div className="flex items-center justify-between gap-4 text-[10px] text-white/35 font-mono mb-2">
                  <span className="font-semibold text-white/60 tracking-wider">
                    {isBot ? 'U-BOT' : 'OPERATOR'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <div className="whitespace-pre-wrap text-white/85 leading-relaxed font-sans">
                  {msg.text}
                </div>

                {/* Inline Voice Waveform Widget */}
                {msg.audioUrl && (
                  <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.08]">
                    <button
                      onClick={() => playAudio(`${apiBaseUrl}${msg.audioUrl}`)}
                      className="flex items-center gap-2.5 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/30">
                        {currentlyPlayingAudio === `${apiBaseUrl}${msg.audioUrl}` ? (
                          <Pause className="w-3 h-3 fill-current" />
                        ) : (
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        )}
                      </div>
                      <span>
                        {currentlyPlayingAudio === `${apiBaseUrl}${msg.audioUrl}`
                          ? 'Pause audio briefing'
                          : 'Listen to voice briefing'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="w-1 h-2 rounded-full bg-cyan-400/60 animate-pulse" />
                      <span className="w-1 h-3.5 rounded-full bg-cyan-400/80 animate-pulse" />
                      <span className="w-1 h-2 rounded-full bg-cyan-400/60 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* ── CARD 1: Payment Approval Card (HitL) ────────── */}
                {msg.isApprovalCard && msg.card && (
                  <div className="mt-4 rounded-xl bg-cyan-950/20 ring-1 ring-cyan-400/30 p-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                      <div>
                        <h4 className="font-semibold text-white text-[13px] tracking-tight">
                          {msg.card.title}
                        </h4>
                        <p className="text-[11px] text-cyan-300/80">{msg.card.subtitle}</p>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30 font-medium">
                        HITL Gate
                      </span>
                    </div>

                    {/* Metrics Matrix */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {msg.card.metrics?.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg ${
                            m.highlight
                              ? 'bg-emerald-500/10 ring-1 ring-emerald-400/30 text-emerald-200'
                              : 'bg-white/[0.03] ring-1 ring-white/[0.06] text-white/70'
                          }`}
                        >
                          <span className="text-[10px] text-white/40 block font-mono uppercase">{m.label}</span>
                          <span className="font-mono font-semibold text-white text-xs block mt-0.5">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCardAction('APPROVE_PAYMENT', msg.sessionId)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Authorize on Avalanche Fuji</span>
                      </button>

                      <button
                        onClick={() => handleCardAction('CANCEL_PAYMENT', msg.sessionId)}
                        disabled={isLoading}
                        className="py-2.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Abort
                      </button>
                    </div>
                  </div>
                )}

                {/* ── CARD 2: Settlement Confirmed Card ───────────── */}
                {msg.isConfirmedCard && msg.card && (
                  <div className="mt-4 rounded-xl bg-emerald-950/20 ring-1 ring-emerald-400/30 p-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-white text-[13px] tracking-tight">
                            {msg.card.title}
                          </h4>
                          <p className="text-[11px] text-emerald-300/80">{msg.card.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 font-medium">
                        Mined
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {msg.card.metrics?.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white/[0.03] ring-1 ring-white/[0.06]">
                          <span className="text-[10px] text-white/40 block font-mono uppercase">{m.label}</span>
                          <span className="font-mono font-semibold text-emerald-300 text-xs block mt-0.5">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Verify & Export */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 font-sans">
                      {msg.settlementData?.explorerUrl && (
                        <a
                          href={msg.settlementData.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/[0.08] text-white/80 hover:text-white text-xs font-medium transition-colors"
                        >
                          <span>Verify Snowtrace</span>
                          <ExternalLink className="w-3 h-3 text-white/50" />
                        </a>
                      )}

                      <button
                        onClick={() => handleExportReconciliationCSV(msg)}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors cursor-pointer"
                        title="Download double-entry ERP reconciliation CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── CARD 3: Compliance Blocked Card ─────────────── */}
                {msg.isBlockedCard && msg.card && (
                  <div className="mt-4 rounded-xl bg-rose-950/20 ring-1 ring-rose-500/30 p-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-white text-[13px] tracking-tight">
                            {msg.card.title}
                          </h4>
                          <p className="text-[11px] text-rose-300/80">{msg.card.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30 font-medium">
                        Sanctioned
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      {msg.card.metrics?.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-black/40 rounded-lg">
                          <span className="text-white/40 font-mono text-[10px] uppercase">{m.label}:</span>
                          <span className="font-mono font-semibold text-rose-200 text-xs">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (onInspectCompliance) {
                          onInspectCompliance({
                            code: 'OFAC_SANCTION_MATCH',
                            flagReason: 'OFAC SDN Match: Tornado Cash',
                            checkedAddress: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b',
                            vendorName: 'Tornado Cash Router',
                            invoiceNumber: 'INV-OFAC-001',
                            scanLatencyMs: 14,
                          });
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Inspect Compliance Intercept Protocol</span>
                    </button>
                  </div>
                )}
              </div>

              {!isBot && (
                <div className="w-7 h-7 rounded-lg bg-white/[0.08] ring-1 ring-white/[0.12] flex items-center justify-center text-white/70 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] ring-1 ring-cyan-400/20 text-cyan-300 text-xs w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span className="font-mono text-[11px]">DeepSeek V4.1 Flash reasoning & processing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Modern Bottom Command Bar ────────────────────────────── */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0A0D15]/90 backdrop-blur-xl shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatchMessage(inputText);
          }}
          className="relative flex items-center bg-white/[0.04] ring-1 ring-white/[0.1] focus-within:ring-cyan-400/40 focus-within:bg-white/[0.06] rounded-2xl transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask U-Bot or type 'Pay AWS $2,500'..."
            disabled={isLoading}
            className="flex-1 bg-transparent px-4 py-3 text-[13px] text-white placeholder-white/30 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="mr-2 p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/[0.05] text-black disabled:text-white/20 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="Dispatch prompt"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] text-white/35 font-mono px-1">
          <span>Snowman BFT Consensus</span>
          <span>DeepSeek V4.1 Flash · Sub-2s SLA</span>
        </div>
      </div>
    </div>
  );
};

export default UBotSimulator;
