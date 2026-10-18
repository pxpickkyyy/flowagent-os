/**
 * FlowAgent OS — Centralized HyperFrames Video Configuration (Single Source of Truth)
 * Edit copy, brand colors, metrics, or beat timing here to update both 16:9 and 9:16 renders.
 */
window.FLOWAGENT_CONFIG = {
  meta: {
    title: "FlowAgent OS — Autonomous Accounts Payable on Avalanche",
    url: "https://flowagent-os.vercel.app/",
    displayUrl: "flowagent-os.vercel.app",
    fps: 60,
    bpm: 120,
    beatSec: 0.5,
    barSec: 2.0,
    duration16x9: 60,
    duration9x16: 30,
    durationLoop: 6,
    prngSeed: 1337
  },
  palette: {
    bgPrimary: "#050505",
    bgElevated: "#0E0E10",
    bgSurface: "#09090A",
    textPrimary: "#F5F5F4",
    textSecondary: "#A8A29E",
    textMuted: "#78716C",
    accentEmerald: "#34D399",
    accentEmeraldLight: "#6EE7B7",
    accentEmeraldDark: "#022014",
    accentCyan: "#38BDF8",
    accentAmber: "#FCD34D",
    dangerRose: "#F43F5E",
    dangerRoseLight: "#FB7185",
    dangerRoseSoft: "#FECDD3"
  },
  fonts: {
    display: "'Plus Jakarta Sans', sans-serif",
    serif: "'Instrument Serif', Georgia, serif",
    sans: "'Plus Jakarta Sans', sans-serif",
    mono: "'JetBrains Mono', monospace"
  },
  brand: {
    name: "FlowAgent OS",
    eyebrow: "Autonomous accounts payable · Avalanche",
    status: "Operational",
    blockHeight: "#59490095",
    network: "Avalanche C-Chain · Chain 43114"
  },
  hero: {
    h1Part1: "Invoices in.",
    h1Serif: "Settlement out.",
    h1Part3: "Sub-second.",
    subtitle: "FlowAgent OS reads commercial invoices, screens every counterparty against OFAC, races SWIFT for the cheapest rail and settles on Avalanche — non-custodially, in a single authorization.",
    writtenHookSub: "Legacy cross-border wires bleed $112.50 in fees and stall for 5 business days.",
    ctaPrimary: "Launch workstation",
    ctaSecondary: "Test sanctions halt",
    metrics: [
      { value: "0.09s", numeric: 0.09, decimals: 2, suffix: "s", label: "Consensus finality (< 2.0s)", color: "#34D399" },
      { value: "97.8%", numeric: 97.8, decimals: 1, suffix: "%", label: "Cheaper than a SWIFT wire", color: "#38BDF8" },
      { value: "34ms", numeric: 34, decimals: 0, suffix: "ms", label: "Sanctions halt, zero gas", color: "#FB7185" }
    ]
  },
  workstation: {
    writtenTag: "AUTONOMOUS AP WORKSTATION · 4 DETERMINISTIC GATES",
    scenarios: [
      { id: "aws", vendor: "Amazon Web Services", amount: "$2,500.00 USDC", badge: "CLEAN · VERIFIED", tone: "emerald" },
      { id: "nodeops", vendor: "NodeOps Cloud", amount: "850 AVAX", badge: "CLIFF ADVISORY", tone: "amber" },
      { id: "tornado", vendor: "Tornado Cash", amount: "15,000 USDT", badge: "OFAC SANCTIONED", tone: "danger" }
    ],
    gate1: {
      title: "1. Commercial invoice ingestion",
      badge: "Dual OCR & EVM Parsed",
      vendor: "Amazon Web Services, Inc.",
      invoiceId: "INV-2026-901",
      amount: "$2,500.00 USDC",
      wallet: "0x71C95911E9a5D330f4D621842EC243EE1343292e",
      lineItem: "Enterprise Cloud Compute & EKS Nodes (Q4)"
    },
    gate2: {
      title: "2. U-Bot financial copilot",
      badge: "ElevenLabs TTS & Tokenomist Intelligence",
      status: "Voice Ready · 32-Bar Neural Telemetry",
      tokenomist: {
        circulating: "61.1%",
        nextCliff: "38d",
        unlockVol: "1.24% supply"
      },
      cleanTranscript: "\"Invoice INV-2026-901 from Amazon Web Services for $2,500.00 USDC verified. Zero OFAC sanctions hits. Avalanche C-Chain saves $110.00 over SWIFT wire — 97.8% fee reduction.\""
    },
    gate4: {
      title: "4. Liquidity routing & settlement benchmark",
      badge: "Rail arbitrage",
      swift: {
        label: "Traditional SWIFT Wire",
        fee: "$112.50",
        feeNum: 112.5,
        speed: "3–5 Business Days",
        detail: "$45 wire + 2.7% FX spread"
      },
      avalanche: {
        label: "Avalanche C-Chain",
        fee: "$2.50",
        feeNum: 2.5,
        speed: "~1.2 Seconds",
        detail: "Snowman BFT Finality"
      },
      savingsValue: "$110.00",
      savingsNum: 110.0,
      reductionValue: "97.8%"
    },
    gate3Clean: {
      title: "3. Execution lifecycle",
      badge: "OFAC SDN Screening & Guard",
      ctaLabel: "Authorize Settlement · $2,500.00 USDC",
      settledBanner: "SETTLED ON AVALANCHE",
      finality: "0.09s (90ms)",
      block: "#59490095",
      txHash: "0x94f8a2b1c7d4e5093c8a11f0e29d4b678a3e109f",
      csvFile: "flowagent-reconciliation-INV-2026-901.csv"
    },
    gate3Sanctioned: {
      banner: "SANCTIONS ENFORCEMENT ACTIVE",
      subBanner: "OFAC SDN Match Detected — Execution Terminated",
      vendor: "Tornado Cash Router",
      invoiceId: "INV-2026-403",
      wallet: "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c",
      latency: "34ms pre-signature",
      gasSpent: "0.00 AVAX gas spent",
      ubotAlert: "\"CRITICAL ALERT: Counterparty 0x8576...353c matches OFAC SDN list (Tornado Cash Router). Execution terminated pre-signature in 34 milliseconds. Zero gas expended.\""
    },
    dagTitle: "DETERMINISTIC 4-GATE DAG · ZERO HUMAN BOTTLENECKS"
  },
  scenes: [
    { id: "s01", name: "01-hook", start: 0.0, duration: 6.0 },
    { id: "s02", name: "02-problem", start: 6.0, duration: 7.0 },
    { id: "s03", name: "03-ingest-ubot", start: 13.0, duration: 9.0 },
    { id: "s04", name: "04-arbitrage", start: 22.0, duration: 8.0 },
    { id: "s05", name: "05-settlement", start: 30.0, duration: 8.0 },
    { id: "s06", name: "06-ofac-halt", start: 38.0, duration: 9.0 },
    { id: "s07", name: "07-workflow-dag", start: 47.0, duration: 6.5 },
    { id: "s08", name: "08-cta", start: 53.5, duration: 6.5 }
  ]
};
