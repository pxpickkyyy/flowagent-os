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
  Paperclip,
  Loader2,
  AlertTriangle,
  Terminal,
  BarChart3,
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
}

export const UBotSimulator: React.FC<UBotSimulatorProps> = ({
  apiBaseUrl = '',
  onInspectCompliance,
  onInvoiceActionDispatched,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ubot',
      text: "Welcome to FlowAgent OS Tactical AP Terminal.\n\nI am your autonomous corporate accounts payable agent on Avalanche Fuji (Chain 43113).\n\nSelect a Quick-Demo docket below or upload an invoice file to verify zero-lag OCR extraction, sub-100ms OFAC sanctions checking, and sub-second settlement.",
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
          text: 'Communication error reaching `/api/ubot/message`. Ensure backend is running on port 3000.',
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
          text: 'Payment cancelled by operator. No funds were broadcasted on-chain.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, cancelMsg]);
      } else if (action === 'APPROVE_PAYMENT') {
        const confirmedMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'ubot',
          text: data.replyText || 'Payment successfully settled on Avalanche Fuji C-Chain.',
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
          text: 'Action dispatch failed. Please check network telemetry.',
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
      text: `INVOICE FILE ATTACHED: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
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
        text: data.replyText || 'Invoice uploaded and parsed successfully.',
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
    <div data-ui="ubot-simulator" className="double-bezel-shell h-full flex flex-col">
      <div className="double-bezel-core h-full flex flex-col overflow-hidden corner-crosshair">
        {/* Simulator Terminal Header */}
        <div className="p-4 lg:p-5 bg-black/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-phosphor-cyan">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold uppercase text-white font-display">
                  U-BOT COPILOT TERMINAL
                </h3>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-phosphor-cyan font-extrabold font-sans">
                  STREAM ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 uppercase font-sans">
                HITL COGNITIVE DISPATCH // ELEVENLABS SPEECH RUNTIME
              </p>
            </div>
          </div>

          {/* Audio Indicator */}
          {currentlyPlayingAudio ? (
            <button
              onClick={stopAudio}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400 text-phosphor-cyan text-xs font-bold btn-island cursor-pointer font-sans"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>SYNTHESIZING... [MUTE]</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 uppercase flex items-center gap-1 font-sans">
              <VolumeX className="w-3 h-3 text-slate-600" />
              <span>VOICE STANDBY</span>
            </div>
          )}
        </div>

        {/* Quick-Demo Action Presets Bar */}
        <div className="p-3 bg-[#060A14] flex flex-wrap items-center gap-2 font-sans">
          <span className="text-[10px] uppercase text-slate-400 font-extrabold">
            QUICK DOCKET:
          </span>

          {/* 1. Pay AWS Invoice $2,500 */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => dispatchMessage('Pay AWS Invoice $2,500')}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/50 text-phosphor-cyan text-xs font-bold btn-island disabled:opacity-50 cursor-pointer"
          >
            <span>AWS CLOUD ($2,500)</span>
            <div className="btn-icon-wrapper w-4 h-4 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5" />
            </div>
          </button>

          {/* 2. Test OFAC Sanctioned */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => dispatchMessage('Test OFAC Sanctioned (Tornado Cash)')}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hazard-dark/40 hover:bg-hazard-dark/60 border border-hazard text-white text-xs font-bold btn-island disabled:opacity-50 cursor-pointer"
          >
            <span>OFAC TORNADO CASH</span>
            <div className="btn-icon-wrapper w-4 h-4 rounded bg-hazard border border-white flex items-center justify-center">
              <ShieldAlert className="w-2.5 h-2.5" />
            </div>
          </button>

          {/* 3. NodeOps Cloud */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => dispatchMessage('Pay NodeOps Cloud $850')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-200 text-xs btn-island disabled:opacity-50 cursor-pointer"
          >
            <span>NODEOPS ($850)</span>
          </button>

          {/* 4. Tokenomist Vesting Intel */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => dispatchMessage('Query AVAX Tokenomics & Unlock Schedule (Tokenomist)')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold btn-island disabled:opacity-50 cursor-pointer"
          >
            <BarChart3 className="w-3 h-3 text-indigo-400" />
            <span>TOKENOMIST VESTING</span>
          </button>

          {/* 4. Status */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => dispatchMessage('Check wallet balance and network status')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-200 text-xs btn-island disabled:opacity-50 cursor-pointer"
          >
            <span>STATUS</span>
          </button>

          {/* Hidden File Input */}
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
            title="Upload Custom Invoice PDF/JSON"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs btn-island disabled:opacity-50 cursor-pointer ml-auto"
          >
            <Paperclip className="w-3 h-3 text-phosphor-cyan" />
            <span>UPLOAD PDF</span>
          </button>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs sm:text-sm">
          {messages.map((msg) => {
            const isBot = msg.sender === 'ubot';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-phosphor-cyan shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-xl p-4 ${
                    isBot
                      ? 'bg-black/60 border border-white/10 text-slate-100'
                      : 'bg-cyan-700 text-white font-medium ml-auto'
                  }`}
                >
                  {/* Timestamp & Sender */}
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-2 pb-1 bg-black/40 rounded p-1.5">
                    <span className="font-extrabold uppercase text-slate-300">
                      {isBot ? 'FLOWAGENT / U-BOT COPILOT' : 'OPERATOR / DRIVER'}
                    </span>
                    <samp className="font-mono">{msg.timestamp}</samp>
                  </div>

                  {/* Prose */}
                  <div className="leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</div>

                  {/* Audio Synthesizer Widget */}
                  {msg.audioUrl && (
                    <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-cyan-500/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playAudio(`${apiBaseUrl}${msg.audioUrl}`)}
                          className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400 flex items-center justify-center text-phosphor-cyan btn-island cursor-pointer"
                          title="Play Speech"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <span className="text-[10px] uppercase text-phosphor-cyan font-bold font-sans">
                          ELEVENLABS SPEECH SYNTHESIS
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="h-2 w-1 bg-phosphor-cyan rounded-full"></span>
                        <span className="h-3 w-1 bg-phosphor-cyan rounded-full"></span>
                        <span className="h-4 w-1 bg-phosphor-cyan rounded-full"></span>
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE CARD 1: Payment Approval Card */}
                  {msg.isApprovalCard && msg.card && (
                    <div className="mt-4 p-4 rounded-xl bg-black/70 border-2 border-cyan-500/70 space-y-3 text-xs">
                      <div className="flex items-center justify-between gap-2 bg-black/40 p-2 rounded-lg">
                        <div>
                          <h4 className="font-extrabold uppercase text-white text-sm font-display">
                            {msg.card.title}
                          </h4>
                          <p className="text-[10px] text-phosphor-cyan font-sans">{msg.card.subtitle}</p>
                        </div>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-phosphor-cyan font-bold font-sans">
                          HITL VERIFIED
                        </span>
                      </div>

                      {/* Metrics Matrix */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {msg.card.metrics?.map((m, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border ${
                              m.highlight
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-phosphor-green'
                                : 'bg-black/60 border-white/10 text-slate-300'
                            }`}
                          >
                            <span className="text-slate-400 block text-[10px] uppercase font-sans">{m.label}</span>
                            <samp className="font-extrabold text-white text-xs font-mono block">{m.value}</samp>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-2 pt-2 bg-black/40 p-2 rounded-lg">
                        <button
                          onClick={() => handleCardAction('APPROVE_PAYMENT', msg.sessionId)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs btn-island disabled:opacity-50 cursor-pointer uppercase font-sans"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>APPROVE &amp; BROADCAST (FUJI)</span>
                        </button>

                        <button
                          onClick={() => handleCardAction('CANCEL_PAYMENT', msg.sessionId)}
                          disabled={isLoading}
                          className="px-4 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 text-xs btn-island disabled:opacity-50 cursor-pointer uppercase font-bold font-sans"
                        >
                          ABORT
                        </button>
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE CARD 2: Settlement Confirmed Card */}
                  {msg.isConfirmedCard && msg.card && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-400 space-y-3 text-xs">
                      <div className="flex items-center justify-between gap-2 bg-black/40 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-phosphor-green" />
                          <div>
                            <h4 className="font-extrabold uppercase text-white text-sm font-display">
                              {msg.card.title}
                            </h4>
                            <p className="text-[10px] text-phosphor-green font-bold font-sans">{msg.card.subtitle}</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-phosphor-green font-extrabold font-sans">
                          FINALIZED
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {msg.card.metrics?.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-black/60 border border-emerald-800/40"
                          >
                            <span className="text-slate-400 block text-[10px] uppercase font-sans">{m.label}</span>
                            <samp className="font-extrabold text-phosphor-green text-xs font-mono block">{m.value}</samp>
                          </div>
                        ))}
                      </div>

                      {/* Links & CSV Export */}
                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 bg-black/40 p-2 rounded-lg font-sans">
                        {msg.settlementData?.explorerUrl && (
                          <a
                            href={msg.settlementData.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-black/60 border border-emerald-500/50 text-phosphor-cyan hover:text-white hover:border-cyan-400 text-xs font-bold uppercase"
                          >
                            <span>VERIFY ON SNOWTRACE</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          onClick={() => handleExportReconciliationCSV(msg)}
                          className="group w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold btn-island cursor-pointer uppercase"
                          title="Download PEAK / FlowAccount formatted reconciliation CSV"
                        >
                          <span>EXPORT RECONCILIATION CSV</span>
                          <div className="btn-icon-wrapper w-4 h-4 rounded bg-black/40 flex items-center justify-center">
                            <Download className="w-2.5 h-2.5" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE CARD 3: Compliance Blocked Card */}
                  {msg.isBlockedCard && msg.card && (
                    <div className="mt-4 p-4 rounded-xl bg-hazard-dark/40 border-2 border-hazard space-y-3 text-xs hazard-stripes">
                      <div className="flex items-center justify-between gap-2 bg-black/70 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-hazard" />
                          <div>
                            <h4 className="font-extrabold uppercase text-white text-sm font-display">
                              {msg.card.title}
                            </h4>
                            <p className="text-[10px] text-rose-200 font-bold font-sans">{msg.card.subtitle}</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-hazard text-white font-extrabold font-sans">
                          SANCTIONED
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px] bg-black/80 p-2 rounded-lg border border-hazard/50">
                        {msg.card.metrics?.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1 px-2 bg-black/40 rounded"
                          >
                            <span className="text-slate-400 uppercase text-[10px] font-sans">{m.label}:</span>
                            <samp className="font-bold text-rose-200 font-mono">{m.value}</samp>
                          </div>
                        ))}
                      </div>

                      {/* Inspect Protocol Button */}
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
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-hazard hover:bg-hazard-dark text-white font-extrabold text-xs btn-island cursor-pointer uppercase font-sans"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>INSPECT COMPLIANCE INTERCEPT PROTOCOL</span>
                      </button>
                    </div>
                  )}
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-700 border border-cyan-400 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/60 border border-cyan-500/40 text-phosphor-cyan text-xs w-fit font-sans">
              <Loader2 className="w-4 h-4 animate-spin text-phosphor-cyan" />
              <span>PIPELINE BUS ACTIVE: PROCESSING ON FUJI C-CHAIN</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Text Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatchMessage(inputText);
          }}
          className="p-3 bg-black/80 flex items-center gap-2 font-sans"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type 'Pay AWS Invoice $2,500' or dispatch message..."
            disabled={isLoading}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 btn-island cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default UBotSimulator;
