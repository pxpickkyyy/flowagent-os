---
marp: true
theme: default
paginate: true
size: 16:9
header: "FlowAgent OS | Hackathon Pitch Deck"
footer: "Avalanche Hackathon 2026 • Confidential"
style: |
  section {
    background-color: #0b0f19;
    color: #f1f5f9;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 36px 54px;
    font-size: 0.95rem;
  }
  h1 {
    color: #38bdf8;
    font-size: 2.2rem;
    margin-bottom: 0.2rem;
    letter-spacing: -0.02em;
  }
  h2 {
    color: #f8fafc;
    font-size: 1.55rem;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 14px;
  }
  h3 {
    color: #38bdf8;
    font-size: 1.05rem;
    margin-top: 0.4rem;
    margin-bottom: 0.3rem;
  }
  p, li {
    font-size: 0.92rem;
    line-height: 1.45;
    color: #cbd5e1;
  }
  strong {
    color: #ffffff;
  }
  .highlight-green {
    color: #34d399;
    font-weight: 700;
  }
  .highlight-red {
    color: #f87171;
    font-weight: 700;
  }
  .highlight-blue {
    color: #38bdf8;
    font-weight: 700;
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 600;
  }
  .badge-clean { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
  .badge-halt { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
  .badge-tech { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
  table {
    font-size: 0.82rem;
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }
  th {
    background-color: #1e293b;
    color: #94a3b8;
    text-align: left;
    padding: 6px 10px;
    border: 1px solid #334155;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #334155;
    background-color: #0f172a;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
  }
  .card {
    background-color: #111827;
    border: 1px solid #1f2937;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .card-danger {
    background-color: #181116;
    border: 1px solid #7f1d1d;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .card-success {
    background-color: #0b1a17;
    border: 1px solid #065f46;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .metric-box {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 8px;
    text-align: center;
  }
  .metric-val {
    font-size: 1.55rem;
    font-weight: 800;
    line-height: 1.1;
  }
  .metric-lbl {
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  footer {
    color: #64748b;
    font-size: 0.72rem;
  }
  header {
    color: #64748b;
    font-size: 0.72rem;
  }
---

<!-- _class: lead -->
# 🌐 FlowAgent OS
### Autonomous Accounts Payable Orchestration for Global Enterprise
**Zero-Friction Cross-Border B2B Settlement with Sub-2s Finality & Deterministic OFAC Guards**

<div style="margin-top: 24px; display: flex; gap: 12px;">
  <span class="badge badge-tech">Avalanche C-Chain</span>
  <span class="badge badge-clean">Gemini 2.5 Flash OCR</span>
  <span class="badge badge-tech">ElevenLabs Voice</span>
  <span class="badge badge-tech">U-Bot Copilot</span>
  <span class="badge badge-clean">Tokenomist Intelligence</span>
</div>

---

<!-- Slide 1 -->
## 1. The Problem: The $120B Cross-Border Wire Trap

Traditional enterprise B2B payments rely on a 50-year-old correspondent banking network that introduces massive float delays, opaque predatory markups, and human reconciliation bottlenecks.

<div class="grid-3" style="margin-top: 14px;">
  <div class="metric-box">
    <div class="metric-val highlight-red">3–5 Days</div>
    <div class="metric-lbl">Capital Float Lockup</div>
    <p style="font-size: 0.78rem; margin: 4px 0 0 0; color: #94a3b8;">Manual SWIFT batches cross 3–4 correspondent intermediaries before reaching vendor accounts.</p>
  </div>
  <div class="metric-box">
    <div class="metric-val highlight-red">3.5% Spread</div>
    <div class="metric-lbl">Hidden FX Penalty</div>
    <p style="font-size: 0.78rem; margin: 4px 0 0 0; color: #94a3b8;">Commercial banks extract aggressive foreign exchange margins on every cross-border payout.</p>
  </div>
  <div class="metric-box">
    <div class="metric-val highlight-red">$25–$50</div>
    <div class="metric-lbl">Fixed Toll Per Wire</div>
    <p style="font-size: 0.78rem; margin: 4px 0 0 0; color: #94a3b8;">Fixed wire fees make micro-payments and recurring SaaS subscriptions cost-prohibitive.</p>
  </div>
</div>

<div class="card-danger" style="margin-top: 14px;">
  <strong class="highlight-red">The Real-World SME Toll:</strong> Paying a standard $2,500 AWS or offshore engineering invoice via legacy bank wire burns <strong>$112.50 in fees</strong> ($25 wire toll + $87.50 FX fee) and stalls vendor delivery for <strong>nearly a week</strong>.
</div>

<!--
Presenter Cue (0:00 - 0:30):
"Judges, every global business faces the same multi-day nightmare: sending money across borders means losing 3.5% in predatory FX markups, paying $25 per wire, and waiting 3 to 5 business days for funds to clear. For a simple $2,500 AWS bill, that is $112 wasted and zero real-time visibility. Today, we introduce FlowAgent OS to replace this obsolete legacy banking chain."
-->

---

<!-- Slide 2 -->
## 2. The Solution: FlowAgent OS Autonomous AP

FlowAgent OS is a **non-custodial, end-to-end Accounts Payable operating system** that converts unstructured vendor PDFs into sub-second, cryptographically settled blockchain transactions.

<div class="grid-2">
  <div class="card">
    <h3 class="highlight-blue">⚡ Instant On-Chain Finality</h3>
    <p>Replaces multi-day correspondent wires with <strong>sub-2.0s block confirmation</strong> on Avalanche C-Chain using Snowman BFT consensus.</p>
    <div class="metric-box" style="margin-top: 8px;">
      <span class="metric-val highlight-green">97.8% Fee Reduction</span>
      <div class="metric-lbl">$112.50 Bank Fee → $2.50 Web3 Settlement</div>
    </div>
  </div>
  <div class="card">
    <h3 class="highlight-blue">🛡️ Zero-Touch Autonomous Pipeline</h3>
    <ul style="padding-left: 18px; margin: 4px 0;">
      <li><strong>Dropzone Ingestion</strong>: Drag-and-drop PDF extraction via Gemini 2.5 Flash.</li>
      <li><strong>Routing Optimization</strong>: Live mathematical fee arbitrage (SWIFT vs Fuji).</li>
      <li><strong>Deterministic OFAC Guard</strong>: Microsecond sanctions screening before signing.</li>
      <li><strong>Audit Reconciliation</strong>: Instant ERP-ready JSON export with mined tx hash.</li>
    </ul>
  </div>
</div>

<div class="card-success" style="margin-top: 12px; text-align: center;">
  <strong>Verdict:</strong> Faster capital turnover for enterprises, instant liquidity for vendors, and zero custodial risk.
</div>

<!--
Presenter Cue (0:30 - 1:00):
"FlowAgent OS transforms accounts payable into an autonomous, sub-2-second experience. By orchestrating invoice extraction directly to the Avalanche C-Chain, we cut processing fees by up to 98%—dropping a $112 bank fee down to just $2.50. The finance team drops a PDF, our pipeline optimizes the route, verifies compliance, and executes settlement with non-custodial cryptographic certainty."
-->

---

<!-- Slide 3 -->
## 3. Hybrid Architecture: Strict Separation of Concerns

Our core engineering principle: **"AI for Semantic Flexibility; 100% Deterministic Code for Capital Safety."**

<div class="grid-3">
  <div class="card">
    <div class="badge badge-tech">Layer 1: AI Ingestion</div>
    <h3>Probabilistic Extraction</h3>
    <ul style="padding-left: 14px; font-size: 0.8rem;">
      <li><strong>Gemini 2.5 Flash</strong> structured schema extraction (<1,500ms SLA).</li>
      <li>Contextual payee/vendor entity detection.</li>
      <li><strong>Regex Fast-Path</strong> fallback (<40ms) ensures zero stage downtime.</li>
      <li><em>AI never touches private keys or balances.</em></li>
    </ul>
  </div>

  <div class="card">
    <div class="badge badge-clean">Layer 2: Deterministic Core</div>
    <h3>Zero-Hallucination Guard</h3>
    <ul style="padding-left: 14px; font-size: 0.8rem;">
      <li><strong>OFAC/SDN Blacklist</strong>: Sub-millisecond lookup (Tornado, Lazarus, Garantex).</li>
      <li><strong>EVM Checksum</strong> & bytecode detection (<code>provider.getCode</code> for EOA vs Contract).</li>
      <li><strong>Mathematical Arbitrage</strong>: Live gas oracle vs 3.5% SWIFT benchmark.</li>
      <li><em>100% rule-based execution.</em></li>
    </ul>
  </div>

  <div class="card">
    <div class="badge badge-tech">Layer 3: Settlement Engine</div>
    <h3>Cryptographic Execution</h3>
    <ul style="padding-left: 14px; font-size: 0.8rem;">
      <li><strong>Avalanche C-Chain</strong> native ECDSA wallet signing.</li>
      <li><strong>Circle Fuji USDC</strong> dynamic 6-decimal batch transfers.</li>
      <li><strong>Monotonic Nonce Queue</strong> preventing tx replacement collisions.</li>
      <li><strong>Dual-rail fallback</strong>: 0.0001 AVAX institutional liquidity probe.</li>
    </ul>
  </div>
</div>

<div style="font-size: 0.78rem; text-align: center; color: #94a3b8; margin-top: 10px;">
  <code>Unstructured PDF</code> ➔ <code>Gemini Schema JSON</code> ➔ <code>Deterministic Compliance Gate</code> ➔ <code>Avalanche C-Chain Mined Block</code>
</div>

<!--
Presenter Cue (1:00 - 1:30):
"Notice our architectural separation of concerns. We never let probabilistic AI handle fund routing. We use Gemini 2.5 Flash strictly for semantic extraction—parsing unstructured invoices in under 1.5 seconds. But compliance and money movement belong to a 100% deterministic code engine. Our compliance core executes sub-millisecond OFAC checks, and the Avalanche engine signs non-custodial transactions with zero risk of AI hallucination."
-->

---

<!-- Slide 4 -->
## 4. Partner Synergy: Real Ecosystem Integration

FlowAgent OS connects industry-leading Web3 infrastructure, real-time AI copilots, and tokenomics data.

<div class="grid-3">
  <div class="card">
    <div class="badge badge-tech">Avalanche C-Chain</div>
    <h3>Settlement Backbone</h3>
    <p style="font-size: 0.82rem;"><strong>Snowman BFT Finality</strong> delivers ~85ms-128ms settlement latency on Fuji. High throughput and predictable gas costs (~0.000042 AVAX / $0.001) make institutional micropayments viable. Tested on resilient multi-RPC cluster.</p>
  </div>

  <div class="card">
    <div class="badge badge-clean">U-Bot Copilot & ElevenLabs</div>
    <h3>Omnichannel Voice Operations</h3>
    <p style="font-size: 0.82rem;"><strong>U-Bot</strong> handles natural language Telegram commands (<code>PAY</code>, <code>AUDIT</code>, <code>STATUS</code>) with tokenized entity parsing. <strong>ElevenLabs Turbo v2.5</strong> delivers sub-1,200ms real-time auditory confirmation & emergency OFAC siren alerts.</p>
  </div>

  <div class="card">
    <div class="badge badge-tech">Tokenomist Intelligence</div>
    <h3>Treasury & Dilution Radar</h3>
    <p style="font-size: 0.82rem;">Deep integration with Tokenomist datasets. Evaluates <strong>38-day cliff unlock schedules</strong>, circulating supply metrics (61.1%), and dilution risk scores before treasury authorizes payouts in volatile native tokens like AVAX.</p>
  </div>
</div>

<div style="margin-top: 10px; padding: 6px 14px; background: #0f172a; border-radius: 6px; font-size: 0.76rem; color: #94a3b8; text-align: center;">
  Seamless Multi-Modal Stack: Avalanche Fuji Testnet • ElevenLabs Turbo v2.5 • Tokenomist Institutional Benchmark • Gemini Flash OCR
</div>

<!--
Presenter Cue (1:30 - 2:00):
"Our partner integrations solve real enterprise workflows. Avalanche provides the sub-second Snowman BFT consensus and low gas fees required for enterprise settlement. U-Bot lets finance directors approve payments directly through Telegram with tokenized intent parsing, while ElevenLabs delivers immediate auditory verification. Finally, Tokenomist guards corporate treasury by auditing token cliff unlock risks before payouts are authorized."
-->

---

<!-- Slide 5 -->
## 5. Business Model & Unit Economics

A capital-efficient, non-custodial B2B SaaS architecture with 99%+ gross margins on software routing.

<div class="grid-2">
  <div class="card">
    <h3 class="highlight-blue">💼 Revenue Model: SaaS + Take-Rate</h3>
    <table style="margin-top: 6px;">
      <tr><th>Tier</th><th>Pricing</th><th>Features</th></tr>
      <tr><td><strong>Growth</strong></td><td>$199 / mo</td><td>Up to 250 invoices/mo, Gemini OCR, OFAC check</td></tr>
      <tr><td><strong>Enterprise</strong></td><td>$1,499 / mo</td><td>Unlimited volume, ERP sync, U-Bot, Tokenomist</td></tr>
      <tr><td><strong>Routing Fee</strong></td><td>10 bps (0.10%)</td><td>Per transaction volume settled over Web3 rails</td></tr>
    </table>
    <p style="font-size: 0.78rem; color: #94a3b8;">*Non-custodial architecture eliminates MTL / money transmitter licensing burdens.</p>
  </div>

  <div class="card">
    <h3 class="highlight-green">📊 Per-Transaction Unit Economics</h3>
    <table style="margin-top: 6px;">
      <tr><th>Item</th><th>Legacy Bank Wire</th><th>FlowAgent OS</th></tr>
      <tr><td>Customer Fee Paid</td><td>$112.50 (3.5% + $25)</td><td><strong>$5.00</strong> (10 bps fee)</td></tr>
      <tr><td>FlowAgent COGS</td><td>N/A</td><td><strong>~$0.002</strong> (AI + Gas)</td></tr>
      <tr><td>Customer Savings</td><td>$0 (baseline)</td><td class="highlight-green"><strong>$107.50 (95.6%)</strong></td></tr>
      <tr><td>Gross Margin</td><td>Low (Banking toll)</td><td class="highlight-green"><strong>> 99.5% Gross Margin</strong></td></tr>
    </table>
  </div>
</div>

<div class="card-success" style="margin-top: 8px; text-align: center; font-size: 0.8rem;">
  <strong>Customer ROI:</strong> An enterprise processing $1M in monthly international invoices saves <strong>$35,000/month</strong> while FlowAgent captures <strong>$1,000/month in high-margin routing revenue</strong>.
</div>

<!--
Presenter Cue (2:00 - 2:30):
"Our business model is pure non-custodial middleware. We charge a standard monthly SaaS tier alongside a 10 basis point volume take-rate. Look at the unit economics: on a $5,000 invoice, the client saves over $107 compared to traditional wire fees, while our marginal cost to process via Gemini and Avalanche is a fraction of a cent. That translates to greater than 99.5% gross margin on software routing without holding user funds."
-->

---

<!-- Slide 6 -->
## 6. Live Demo: Dual Scenario Rehearsal Script

Rehearsal cue card demonstrating deterministic contrast between clean settlement and sanctions compliance.

<div class="grid-2">
  <div class="card-success">
    <div class="badge badge-clean">Scenario A: AWS Clean Settlement</div>
    <h3>INV-2026-901 • $2,500.00 USDC</h3>
    <ol style="padding-left: 16px; font-size: 0.8rem; margin: 4px 0;">
      <li><strong>Select Preset:</strong> AWS Infrastructure Corp.</li>
      <li><strong>Compliance Gate:</strong> OFAC check passes in <span class="highlight-green">&lt;1ms</span>.</li>
      <li><strong>Routing Race:</strong> Shows $112.50 bank cost vs $2.50 Avalanche rail.</li>
      <li><strong>Click "Authorize & Settle":</strong> Instant execution (<code>~128ms</code>).</li>
      <li><strong>On-Chain Verification:</strong> In-app receipt modal displays block height and mined tx hash <code>0xdc75e1...</code>.</li>
      <li><strong>Voice Feedback:</strong> ElevenLabs: <em>"Invoice for AWS verified. Avalanche route saves $110.00. Settled."</em></li>
    </ol>
  </div>

  <div class="card-danger">
    <div class="badge badge-halt">Scenario B: Tornado Cash Halt</div>
    <h3>INV-2026-403 • $5,000.00 USDC</h3>
    <ol style="padding-left: 16px; font-size: 0.8rem; margin: 4px 0;">
      <li><strong>Select Preset:</strong> Tornado Cash Router (<code>0x8576acc5...</code>).</li>
      <li><strong>Compliance Trigger:</strong> Immediate address match on OFAC SDN blacklist.</li>
      <li><strong>Instant Lockdown:</strong> Stage shifts to crimson <span class="highlight-red">FLAGGED</span> state; audio alert tone fires.</li>
      <li><strong>Hard Interlock:</strong> Settle button permanently disabled; zero funds can move.</li>
      <li><strong>Voice Warning:</strong> ElevenLabs: <em>"Warning. Transaction blocked by Compliance Guard. Target address is sanctioned."</em></li>
    </ol>
  </div>
</div>

<div style="margin-top: 8px; text-align: center; font-size: 0.78rem; color: #94a3b8;">
  Presenter Safety Net: <code>Ctrl + Shift + F</code> activates zero-downtime offline fallback mode during stage Wi-Fi drops.
</div>

<!--
Presenter Cue (2:30 - 3:00):
"Now let's see the live demo. First, we load the AWS invoice. In milliseconds, our compliance check confirms a clean OFAC record, our routing engine calculates $110 in savings, and with one click, the transaction is confirmed on Avalanche with a cryptographic receipt and voice confirmation. Next, we load an invoice addressed to Tornado Cash. Instantly, our deterministic compliance gate slams shut, disabling the settlement button and sounding an alert. Clean transactions settle in seconds; sanctioned transactions can never leak capital. That is FlowAgent OS."
-->
