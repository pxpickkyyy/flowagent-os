import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Copy,
  Check,
  RefreshCw,
  X,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';

export interface ComplianceErrorInfo {
  code?: string;
  message?: string;
  flagReason?: string;
  checkedAddress?: string;
  vendorName?: string;
  invoiceNumber?: string;
  actionableResolution?: string[];
  scanLatencyMs?: number;
}

interface ActionableErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorInfo?: ComplianceErrorInfo | null;
  onRetryCleanInvoice?: () => void;
}

export const ActionableErrorModal: React.FC<ActionableErrorModalProps> = ({
  isOpen,
  onClose,
  errorInfo,
  onRetryCleanInvoice,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const flaggedAddress =
    errorInfo?.checkedAddress || '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b';
  const flagReason =
    errorInfo?.flagReason || 'OFAC SDN Sanctioned Entity: Tornado Cash Router';
  const vendor = errorInfo?.vendorName || 'Tornado Cash Router';
  const invoiceNum = errorInfo?.invoiceNumber || 'INV-OFAC-001';
  const scanTime = errorInfo?.scanLatencyMs ?? 14;

  const defaultResolutions = [
    'Automated Disbursement Freeze: Zero gas broadcasted to the Avalanche Fuji mempool. Funds remain safe in corporate treasury.',
    'OFAC SDN Portal Verification: Verify vendor legal entity directly in the official U.S. Treasury Sanctions database.',
    'Compliant Address Remediation: Require vendor compliance officers to provide an authorized corporate payout EVM wallet.',
    'Immutable AML Audit Record: Non-repudiation compliance violation telemetry archived for legal review and regulatory reporting.',
  ];

  const resolutionSteps = errorInfo?.actionableResolution?.length
    ? errorInfo.actionableResolution.map((s) => s.replace(/^\d+\.\s*/, ''))
    : defaultResolutions;

  const handleCopyReport = () => {
    const report = {
      complianceStatus: 'BLOCKED_SANCTION_MATCH',
      timestamp: new Date().toISOString(),
      flaggedAddress,
      flagReason,
      vendor,
      invoiceNumber: invoiceNum,
      detectionEngine: 'FlowAgent Deterministic OFAC SDN Guard',
      actionableResolutions: resolutionSteps,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-ui="actionable-error-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="relative w-full max-w-2xl double-bezel-shell border-2 border-hazard">
        <div className="double-bezel-core p-6 lg:p-8 corner-crosshair bg-[#0A0507] text-slate-100 relative overflow-hidden font-sans">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-hazard cursor-pointer"
            title="Dismiss Intercept Docket"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-5 pb-4 bg-black/40 rounded-xl p-3">
            <div className="w-12 h-12 rounded-xl bg-hazard flex items-center justify-center text-white shrink-0">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-hazard text-white font-sans">
                  COMPLIANCE INTERCEPT
                </span>
                <samp className="text-[11px] text-rose-300 font-mono">
                  LATENCY: {scanTime}ms
                </samp>
              </div>
              <h3 className="text-lg lg:text-xl font-extrabold text-white mt-1 font-display uppercase tracking-wide">
                TRANSACTION HALTED // OFAC SDN SANCTION MATCH
              </h3>
              <p className="text-xs text-rose-200/90 mt-0.5 font-sans">
                Deterministic Compliance Guard triggered. Autonomous disbursement terminated immediately.
              </p>
            </div>
          </div>

          {/* Diagnostic Box */}
          <div className="p-4 rounded-xl bg-black/80 border border-hazard/40 space-y-2.5 text-xs mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 bg-black/40 rounded p-2">
              <span className="text-slate-400 text-[10px] font-sans">SANCTIONED ENTITY:</span>
              <span className="font-extrabold text-white text-sm font-sans">{vendor}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 bg-black/40 rounded p-2">
              <span className="text-slate-400 text-[10px] font-sans">FLAGGED EVM ADDRESS:</span>
              <samp className="font-extrabold text-hazard text-xs break-all font-mono">
                {flaggedAddress}
              </samp>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 bg-black/40 rounded p-2">
              <span className="text-slate-400 text-[10px] font-sans">SANCTION REASON:</span>
              <span className="font-bold text-amber-300 font-sans">{flagReason}</span>
            </div>

            <div className="flex items-center justify-between gap-1 text-[11px] pt-1 font-sans">
              <span className="text-slate-400 text-[10px]">DISBURSEMENT STATUS:</span>
              <span className="font-extrabold text-hazard uppercase">
                ZERO GAS EXPENDITURE • ASSETS PROTECTED
              </span>
            </div>
          </div>

          {/* Actionable Next Steps Protocol */}
          <div className="mb-6 font-sans">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase mb-3 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-hazard" />
              <span>OFFICIAL COMPLIANCE OFFICER PROTOCOL:</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-300">
              {resolutionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-3"
                >
                  <samp className="w-6 h-6 rounded-lg bg-hazard/20 border border-hazard text-hazard text-[11px] font-mono font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </samp>
                  <p className="leading-relaxed font-sans">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 bg-black/40 rounded-xl p-3 font-sans">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-slate-200 hover:text-white hover:border-white/30 btn-island cursor-pointer uppercase font-bold"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-phosphor-green" />
                    <span className="text-phosphor-green font-bold">COPIED JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>COPY AUDIT LOG</span>
                  </>
                )}
              </button>

              <a
                href="https://sanctionssearch.ofac.treas.gov/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-phosphor-cyan hover:border-cyan-400 uppercase font-bold"
              >
                <span>OFAC PORTAL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              {onRetryCleanInvoice && (
                <button
                  onClick={() => {
                    onClose();
                    onRetryCleanInvoice();
                  }}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold btn-island cursor-pointer uppercase"
                >
                  <span>TRY COMPLIANT AWS DOCKET</span>
                  <div className="btn-icon-wrapper w-4 h-4 rounded bg-black/40 flex items-center justify-center">
                    <RefreshCw className="w-2.5 h-2.5" />
                  </div>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 text-xs cursor-pointer uppercase font-bold"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionableErrorModal;
