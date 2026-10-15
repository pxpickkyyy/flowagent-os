import { ethers } from 'ethers';
import { ENV } from '../config/env.js';
import { PaymentIntent } from '../schemas/contracts.js';

export interface AvalancheNetworkStatus {
  chainId: bigint;
  blockNumber: number;
  gasPrice: string;
  isFuji: boolean;
  walletAddress?: string;
  walletBalanceAvax?: string;
}

export class AvalancheService {
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(ENV.AVALANCHE_RPC_URL);

    if (ENV.AVALANCHE_PRIVATE_KEY && ENV.AVALANCHE_PRIVATE_KEY.trim() !== '') {
      try {
        this.wallet = new ethers.Wallet(ENV.AVALANCHE_PRIVATE_KEY, this.provider);
      } catch (err) {
        console.warn('⚠️ Warning: Invalid AVALANCHE_PRIVATE_KEY supplied. Wallet signing will be disabled.');
      }
    }
  }

  /**
   * Ping network and return current status
   */
  async ping(): Promise<AvalancheNetworkStatus> {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    const feeData = await this.provider.getFeeData();

    let walletAddress: string | undefined;
    let walletBalanceAvax: string | undefined;

    if (this.wallet) {
      walletAddress = await this.wallet.getAddress();
      const balanceWei = await this.provider.getBalance(walletAddress);
      walletBalanceAvax = ethers.formatEther(balanceWei);
    }

    return {
      chainId: network.chainId,
      blockNumber,
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') + ' nAVAX' : 'unknown',
      isFuji: network.chainId === 43113n,
      walletAddress,
      walletBalanceAvax,
    };
  }

  /**
   * Broadcast a payment transaction on Avalanche Fuji
   */
  async executePayment(payment: Partial<PaymentIntent> & { recipientAddress: string; amount: string }) {
    if (!this.wallet) {
      throw new Error(
        'AVALANCHE_PRIVATE_KEY is not configured or funded. Set AVALANCHE_PRIVATE_KEY in .env to sign transactions.'
      );
    }

    const tx = await this.wallet.sendTransaction({
      to: payment.recipientAddress,
      value: ethers.parseEther(payment.amount),
    });

    const receipt = await tx.wait(1);

    return {
      txHash: tx.hash,
      status: receipt?.status === 1 ? 'CONFIRMED' : 'FAILED',
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed.toString(),
      explorerUrl: `https://testnet.snowtrace.io/tx/${tx.hash}`,
    };
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getSigner(): ethers.Wallet | undefined {
    return this.wallet;
  }
}

export const avalancheService = new AvalancheService();
