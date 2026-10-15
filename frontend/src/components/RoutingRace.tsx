import React from 'react';
import { Zap, Landmark, ArrowRight, ShieldCheck, CheckCircle2, DollarSign } from 'lucide-react';

export interface RoutingData {
  invoiceAmount?: number;
  traditionalCost?: number;
  traditionalDuration?: string;
  web3Cost?: number;
  web3Duration?: string;
  savingsUsd?: number;
  savingsPercent?: number;
  settlementRail?: string;
}

interface RoutingRaceProps {
  routing?: RoutingData;
}

export const RoutingRace: React.FC<RoutingRaceProps> = ({ routing }) => {
  const invoiceAmount = routing?.invoiceAmount ?? 2500;
  const swiftFee = routing?.traditionalCost ?? 112.5;
  const swiftDuration = routing?.traditionalDuration ?? '3-5 Business Days';
  const fujiFee = routing?.web3Cost ?? 2.54;
  const fujiDuration = routing?.web3Duration ?? '< 2.0s Finality';
  const savingsUsd = routing?.savingsUsd ?? (swiftFee - fujiFee);
  const savingsPercent = routing?.savingsPercent ?? 97.7;
  const railName = routing?.settlementRail ?? 'Avalanche Fuji C-Chain (43113)';

  return (
    <div data-ui="routing-race" className="double-bezel-shell">
      <div className="double-bezel-core p-5 lg:p-6 corner-crosshair relative overflow-hidden font-sans">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-black/40 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-phosphor-green">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase text-white font-display">
                  LIVE ROUTING RACE // LIQUIDITY ARBITRAGE
                </h2>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-phosphor-green font-extrabold font-sans">
                  97.7% MARGIN SAVED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Comparative Cost &amp; Finality Benchmark • Standard ${invoiceAmount.toLocaleString()} Corporate Payout
              </p>
            </div>
          </div>

          {/* High-Contrast Projector Gain Counter */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
            <DollarSign className="w-4 h-4 text-phosphor-green" />
            <span className="text-xs text-slate-300 uppercase font-sans">NET PROFIT RETAINED:</span>
            <samp className="text-base font-extrabold font-mono text-phosphor-green tracking-tight">
              +${savingsUsd.toFixed(2)} USD
            </samp>
          </div>
        </div>

        {/* Side-by-Side Blueprint Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rail A: Legacy SWIFT Wire */}
          <div className="p-4 lg:p-5 rounded-xl border border-rose-900/40 bg-[#12080D] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 bg-black/40 rounded-lg p-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-700/50 flex items-center justify-center text-rose-400">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-white font-display">
                      TRADITIONAL SWIFT
                    </h3>
                    <p className="text-[10px] text-rose-400 font-sans font-semibold">Correspondent Banking Intermediary</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-950/90 border border-rose-600/50 text-rose-300 font-bold font-sans">
                  SLOW &amp; OPAQUE
                </span>
              </div>

              {/* Data rows */}
              <div className="space-y-2 my-3 text-xs">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-black/60 border border-white/[0.06]">
                  <span className="text-slate-400 text-[11px] uppercase font-sans">WIRE DEDUCTION FEE:</span>
                  <samp className="font-extrabold text-rose-300 text-sm tracking-tight font-mono">${swiftFee.toFixed(2)} USD</samp>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-black/60 border border-white/[0.06]">
                  <span className="text-slate-400 text-[11px] uppercase font-sans">SETTLEMENT CLEARING:</span>
                  <samp className="font-bold text-rose-200 font-mono">{swiftDuration}</samp>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-black/60 border border-white/[0.06]">
                  <span className="text-slate-400 text-[11px] uppercase font-sans">COMPLIANCE VISIBILITY:</span>
                  <span className="text-slate-300 text-[11px] font-sans">Delayed Bank MT103 Telex</span>
                </div>
              </div>
            </div>

            {/* Visual Speed Bar */}
            <div className="mt-3 pt-2 bg-black/40 rounded-lg p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
                <span className="uppercase">Throughput Efficiency</span>
                <samp className="text-rose-400 font-bold font-mono">T+3 Days Delay</samp>
              </div>
              <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-rose-950">
                <div className="bg-rose-500 h-full w-[12%]" />
              </div>
            </div>
          </div>

          {/* Rail B: FlowAgent on Avalanche Fuji */}
          <div className="p-4 lg:p-5 rounded-xl border border-emerald-500/50 bg-[#061411] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 bg-black/40 rounded-lg p-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-emerald-400 flex items-center justify-center text-phosphor-green">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-white font-display flex items-center gap-1.5">
                      <span>AVALANCHE FUJI C-CHAIN</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-phosphor-green inline" />
                    </h3>
                    <p className="text-[10px] text-phosphor-green font-bold font-sans">{railName}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-phosphor-green font-extrabold font-sans">
                  OPTIMAL WINNER
                </span>
              </div>

              {/* Data rows */}
              <div className="space-y-2 my-3 text-xs">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-black/60 border border-emerald-500/30">
                  <span className="text-slate-300 text-[11px] uppercase font-sans">TRANSACTION FEE:</span>
                  <samp className="font-extrabold text-phosphor-green text-sm tracking-tight font-mono">
                    ${fujiFee.toFixed(2)} USD
                  </samp>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-black/60 border border-emerald-500/30">
                  <span className="text-slate-300 text-[11px] uppercase font-sans">CONSENSUS FINALITY:</span>
                  <samp className="font-extrabold text-phosphor-cyan text-xs tracking-tight font-mono">{fujiDuration}</samp>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-black/60 border border-emerald-500/30">
                  <span className="text-slate-300 text-[11px] uppercase font-sans">AUDIT VERIFIABILITY:</span>
                  <span className="font-bold text-white text-[11px] flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-phosphor-green" />
                    100% Cryptographic On-Chain
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Speed Bar */}
            <div className="mt-3 pt-2 bg-black/40 rounded-lg p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1 font-sans">
                <span className="uppercase">Throughput Efficiency</span>
                <samp className="text-phosphor-green font-bold font-mono">Instant (&lt; 2.0s) • 97.7% Faster</samp>
              </div>
              <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-emerald-500/30">
                <div className="bg-phosphor-green h-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Technical Verdict Footer */}
        <div className="mt-4 p-3 rounded-xl bg-black/60 border border-white/10 text-xs flex flex-wrap items-center justify-between gap-2 font-sans">
          <div className="flex items-center gap-2 text-slate-200">
            <ArrowRight className="w-4 h-4 text-phosphor-cyan" />
            <span className="text-slate-400 uppercase text-[10px] font-bold">VERDICT:</span>
            <span className="text-white font-semibold">
              Routing through Avalanche Fuji yields net corporate savings of ${savingsUsd.toFixed(2)} ({savingsPercent}%) per transaction.
            </span>
          </div>
          <div className="text-[10px] text-phosphor-cyan font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
            Sub-second Consensus Verified
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutingRace;
