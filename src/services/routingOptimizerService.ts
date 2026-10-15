import { ethers } from 'ethers';
import { avalancheService } from './avalancheService.js';
import { RoutingComparisonResult } from '../schemas/contracts.js';

export class RoutingOptimizerService {
  private readonly DEFAULT_AVAX_PRICE_USD = 25.0; // Benchmark reference price for gas calculation
  private readonly SWIFT_FIXED_WIRE_FEE_USD = 25.0;
  private readonly SWIFT_FX_MARKUP_RATE = 0.035; // 3.5%
  private readonly WEB3_BRIDGE_LIQUIDITY_FEE_RATE = 0.001; // 0.1%
  private readonly NATIVE_TRANSFER_GAS_LIMIT = 21000n;
  private readonly ERC20_TRANSFER_GAS_LIMIT = 65000n;

  // In-memory cache for live gas price (valid for 5 seconds)
  private cachedGasPriceWei: bigint = 25000000000n; // 25 nAVAX fallback
  private lastGasPriceFetch: number = 0;
  private readonly GAS_CACHE_TTL_MS = 5000;

  constructor() {
    // Proactively warm up gas cache in background
    this.refreshGasPrice().catch(() => {});
  }

  /**
   * Refreshes gas price from live Avalanche Fuji RPC
   */
  async refreshGasPrice(): Promise<bigint> {
    try {
      const provider = avalancheService.getProvider();
      const feeData = await Promise.race([
        provider.getFeeData(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 120)),
      ]);
      if (feeData?.gasPrice) {
        this.cachedGasPriceWei = feeData.gasPrice;
        this.lastGasPriceFetch = performance.now();
      }
    } catch {
      // Retain previous or fallback gas price
    }
    return this.cachedGasPriceWei;
  }

  /**
   * Compares Traditional SWIFT banking rails vs Avalanche Web3 settlement rails
   */
  async calculateOptimalRoute(
    amount: number,
    tokenType: 'NATIVE' | 'USDC' = 'USDC'
  ): Promise<RoutingComparisonResult> {
    const cleanAmount = Math.max(0, amount);

    // 1. Traditional SWIFT rail calculation
    const swiftFixedFee = this.SWIFT_FIXED_WIRE_FEE_USD;
    const swiftFxMarkup = Math.round(cleanAmount * this.SWIFT_FX_MARKUP_RATE * 100) / 100;
    const swiftTotalCost = Math.round((swiftFixedFee + swiftFxMarkup) * 100) / 100;

    // 2. Web3 Avalanche Fuji rail calculation (uses fresh or cached gas price)
    let gasPriceWei = this.cachedGasPriceWei;
    if (performance.now() - this.lastGasPriceFetch > this.GAS_CACHE_TTL_MS) {
      gasPriceWei = await this.refreshGasPrice();
    }

    const gasLimit = tokenType === 'USDC' ? this.ERC20_TRANSFER_GAS_LIMIT : this.NATIVE_TRANSFER_GAS_LIMIT;
    const gasFeeWei = gasPriceWei * gasLimit;
    const gasFeeAvax = ethers.formatEther(gasFeeWei);
    const gasFeeUSD = Math.round(parseFloat(gasFeeAvax) * this.DEFAULT_AVAX_PRICE_USD * 1000) / 1000;

    const bridgeLiquidityFeeUSD = Math.round(cleanAmount * this.WEB3_BRIDGE_LIQUIDITY_FEE_RATE * 100) / 100;
    const web3TotalCost = Math.round((gasFeeUSD + bridgeLiquidityFeeUSD) * 100) / 100;

    // 3. Compute Savings
    const savingsUSD = Math.max(0, Math.round((swiftTotalCost - web3TotalCost) * 100) / 100);
    const savingsPercent =
      swiftTotalCost > 0 ? Math.round(((swiftTotalCost - web3TotalCost) / swiftTotalCost) * 1000) / 10 : 0;

    return {
      traditional: {
        rail: 'SWIFT',
        estimatedDuration: '3-5 business days',
        fixedWireFeeUSD: swiftFixedFee,
        fxMarkupUSD: swiftFxMarkup,
        totalCostUSD: swiftTotalCost,
      },
      web3: {
        rail: 'Avalanche Fuji',
        estimatedDuration: '~2.0 seconds',
        gasFeeAvax: parseFloat(gasFeeAvax).toFixed(6),
        gasFeeUSD,
        bridgeLiquidityFeeUSD,
        totalCostUSD: web3TotalCost,
      },
      savingsUSD,
      savingsPercent,
      timeSaved: '3-5 business days vs ~2.0 seconds',
      recommendation: 'WEB3_AVALANCHE',
    };
  }
}

export const routingOptimizerService = new RoutingOptimizerService();
