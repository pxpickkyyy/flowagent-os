import React from 'react';
import {
  FileText,
  ShieldCheck,
  TrendingDown,
  UserCheck,
  CheckCircle,
  AlertOctagon,
  Clock,
  Loader2,
  Zap,
  Activity,
} from 'lucide-react';

export type PipelineStage =
  | 'IDLE'
  | 'PARSING'
  | 'COMPLIANCE_CHECK'
  | 'ROUTING'
  | 'WAITING_APPROVAL'
  | 'SETTLING_ON_AVALANCHE'
  | 'COMPLETED'
  | 'FLAGGED'
  | 'CANCELLED'
  | 'FAILED';

export interface StepBreakdown {
  ingestionMs?: number;
  complianceMs?: number;
  routingMs?: number;
  settlementMs?: number;
  totalDurationMs?: number;
}

interface PipelineStepperProps {
  currentStage: PipelineStage;
  breakdown?: StepBreakdown;
  summaryMessage?: string;
  isFallbackActive?: boolean;
}

interface StepDefinition {
  id: string;
  name: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  associatedStages: PipelineStage[];
  completedAtOrAfter: PipelineStage[];
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  breakdown,
  summaryMessage,
  isFallbackActive = false,
}) => {
  const steps: StepDefinition[] = [
    {
      id: 'ingest',
      name: 'INGEST',
      sub: 'PDF OCR & Schema Extract',
      icon: FileText,
      associatedStages: ['PARSING'],
      completedAtOrAfter: [
        'COMPLIANCE_CHECK',
        'ROUTING',
        'WAITING_APPROVAL',
        'SETTLING_ON_AVALANCHE',
        'COMPLETED',
        'FLAGGED',
      ],
    },
    {
      id: 'compliance',
      name: 'COMPLIANCE',
      sub: 'OFAC Sanction Guard',
      icon: ShieldCheck,
      associatedStages: ['COMPLIANCE_CHECK'],
      completedAtOrAfter: [
        'ROUTING',
        'WAITING_APPROVAL',
        'SETTLING_ON_AVALANCHE',
        'COMPLETED',
      ],
    },
    {
      id: 'route',
      name: 'ROUTE',
      sub: 'Liquidity Cost Optimizer',
      icon: TrendingDown,
      associatedStages: ['ROUTING'],
      completedAtOrAfter: ['WAITING_APPROVAL', 'SETTLING_ON_AVALANCHE', 'COMPLETED'],
    },
    {
      id: 'approval',
      name: 'APPROVAL',
      sub: 'Human-in-the-Loop Gate',
      icon: UserCheck,
      associatedStages: ['WAITING_APPROVAL'],
      completedAtOrAfter: ['SETTLING_ON_AVALANCHE', 'COMPLETED'],
    },
    {
      id: 'settlement',
      name: 'SETTLEMENT',
      sub: 'Avalanche C-Chain 43113',
      icon: Zap,
      associatedStages: ['SETTLING_ON_AVALANCHE'],
      completedAtOrAfter: ['COMPLETED'],
    },
  ];

  const getStepStatus = (
    step: StepDefinition,
    index: number
  ): 'idle' | 'active' | 'completed' | 'flagged' | 'cancelled' => {
    if (currentStage === 'FLAGGED' && index === 1) return 'flagged';
    if (currentStage === 'CANCELLED' && index === 3) return 'cancelled';
    if (step.associatedStages.includes(currentStage)) return 'active';
    if (step.completedAtOrAfter.includes(currentStage)) return 'completed';
    return 'idle';
  };

  const getStepLatency = (index: number): number | undefined => {
    if (!breakdown) return undefined;
    switch (index) {
      case 0:
        return breakdown.ingestionMs;
      case 1:
        return breakdown.complianceMs;
      case 2:
        return breakdown.routingMs;
      case 4:
        return breakdown.settlementMs;
      default:
        return undefined;
    }
  };

  const totalTimeMs = breakdown?.totalDurationMs ?? 0;
  const isWithinSla = totalTimeMs <= 3000;

  return (
    <div data-ui="pipeline-stepper" className="double-bezel-shell">
      <div className="double-bezel-core p-5 lg:p-6 corner-crosshair relative overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-black/40 rounded-xl p-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-phosphor-cyan">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase text-white font-display">
                  EXECUTION PIPELINE // STAGE SEQUENCER
                </h2>
                {isFallbackActive && (
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-hazard-dark/60 border border-hazard text-white font-bold hazard-stripes">
                    OFFLINE PANIC CACHE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Deterministic Execution Telemetry • WebSocket Stream Synchronized
              </p>
            </div>
          </div>

          {/* SLA Performance Readout */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 font-sans">
              <Clock className="w-3.5 h-3.5 text-phosphor-cyan" />
              <span className="text-slate-400 text-[11px] uppercase">CHRONOMETER:</span>
              <samp className={`font-mono font-extrabold text-xs ${isWithinSla ? 'text-phosphor-green' : 'text-hazard'}`}>
                {totalTimeMs > 0 ? `${totalTimeMs}ms` : '0.00s STANDBY'}
              </samp>
            </div>

            <div
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase font-sans ${
                totalTimeMs > 0 && isWithinSla
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-phosphor-green'
                  : 'bg-black/50 border-white/10 text-slate-400'
              }`}
            >
              SLA &lt; 3.0s TARGET
            </div>
          </div>
        </div>

        {/* 5-Step Industrial Sequencer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
          {steps.map((step, index) => {
            const status = getStepStatus(step, index);
            const latency = getStepLatency(index);
            const Icon = step.icon;

            let cardStyles = 'border-white/[0.08] bg-black/40 text-slate-400';
            let iconWrapper = 'text-slate-500 bg-white/[0.03] border-white/10';
            let badgeText = 'STANDBY';
            let badgeStyle = 'bg-white/[0.03] text-slate-500 border-white/10';

            if (status === 'active') {
              cardStyles =
                'border-cyan-400 bg-cyan-950/40 text-white shadow-phosphor-cyan ring-1 ring-cyan-400/50';
              iconWrapper = 'text-phosphor-cyan bg-cyan-900/60 border-cyan-400';
              badgeText = 'EXECUTING';
              badgeStyle = 'bg-cyan-500/20 text-phosphor-cyan border-cyan-400';
            } else if (status === 'completed') {
              cardStyles =
                'border-emerald-500/60 bg-emerald-950/30 text-white shadow-phosphor-green';
              iconWrapper = 'text-phosphor-green bg-emerald-900/60 border-emerald-500';
              badgeText = latency ? `${latency}ms` : 'CONFIRMED';
              badgeStyle = 'bg-emerald-500/20 text-phosphor-green border-emerald-500';
            } else if (status === 'flagged') {
              cardStyles =
                'border-hazard bg-hazard-dark/40 text-white shadow-hazard-glow hazard-stripes ring-1 ring-hazard';
              iconWrapper = 'text-white bg-hazard border-hazard';
              badgeText = 'INTERCEPT';
              badgeStyle = 'bg-hazard text-white border-white font-extrabold';
            } else if (status === 'cancelled') {
              cardStyles = 'border-amber-500/50 bg-amber-950/30 text-slate-300';
              iconWrapper = 'text-amber-400 bg-amber-900/60 border-amber-500';
              badgeText = 'CANCELLED';
              badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500';
            }

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border relative flex flex-col justify-between min-h-[114px] ${cardStyles}`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] text-slate-400 font-extrabold font-sans">
                    STAGE
                  </span>
                  <span
                    className={`text-[9px] uppercase px-2 py-0.5 rounded border font-extrabold ${badgeStyle}`}
                  >
                    {badgeText}
                  </span>
                </div>

                {/* Body */}
                <div className="my-1 flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${iconWrapper}`}
                  >
                    {status === 'active' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : status === 'completed' ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : status === 'flagged' ? (
                      <AlertOctagon className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold font-display uppercase text-white">
                      {step.name}
                    </h4>
                    <p className="text-[10px] font-sans text-slate-400 line-clamp-1 mt-0.5">
                      {step.sub}
                    </p>
                  </div>
                </div>

                {/* Mechanical Track Bar */}
                <div className="mt-2 w-full bg-black/60 rounded-full h-1 overflow-hidden border border-white/[0.05]">
                  <div
                    className={`h-full ${
                      status === 'completed'
                        ? 'bg-phosphor-green w-full'
                        : status === 'active'
                        ? 'bg-phosphor-cyan w-3/4'
                        : status === 'flagged'
                        ? 'bg-hazard w-full'
                        : 'bg-transparent w-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Telemetry Ticker */}
        {summaryMessage && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs flex items-center gap-2.5 text-slate-200 relative z-10 font-sans">
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-phosphor-cyan"></span>
            </span>
            <span className="text-slate-400 uppercase text-[10px] font-bold">
              TELEMETRY BUS:
            </span>
            <span className="font-semibold text-phosphor-cyan truncate">{summaryMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineStepper;
