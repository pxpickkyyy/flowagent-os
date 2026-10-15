import { ethers } from 'ethers';
import { ENV } from './env.js';

export interface RpcEndpointStatus {
  url: string;
  name: string;
  isHealthy: boolean;
  lastLatencyMs?: number;
  lastChecked?: number;
}

export class ResilientRpcProvider extends ethers.JsonRpcProvider {
  private candidateEndpoints: Array<{ url: string; name: string }> = [];
  private activeIndex: number = 0;
  private readonly timeoutMs: number = 1800;
  private subProviders: Map<string, ethers.JsonRpcProvider> = new Map();
  private statusMap: Map<string, RpcEndpointStatus> = new Map();

  constructor(customEndpoints?: string[]) {
    // Initialize base with primary URL and staticNetwork for instant boot
    const primaryUrl = ENV.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
    super(primaryUrl, 43113, { staticNetwork: true });

    const isLocalFork = primaryUrl.includes('127.0.0.1') || primaryUrl.includes('localhost');
    const pool = isLocalFork
      ? [
          { url: primaryUrl, name: 'Local Anvil Fork' },
          { url: 'https://api.avax-test.network/ext/bc/C/rpc', name: 'Official Fuji' },
          { url: 'https://avalanche-fuji-c-chain-rpc.publicnode.com', name: 'PublicNode' },
          { url: 'https://rpc.ankr.com/avalanche_fuji', name: 'Ankr' },
        ]
      : [
          { url: primaryUrl, name: 'Official Fuji' },
          { url: 'https://avalanche-fuji-c-chain-rpc.publicnode.com', name: 'PublicNode' },
          { url: 'https://avalanche-fuji.drpc.org', name: 'dRPC' },
          { url: 'https://rpc.ankr.com/avalanche_fuji', name: 'Ankr' },
        ];

    if (customEndpoints && customEndpoints.length > 0) {
      customEndpoints.forEach((url, i) => {
        if (!pool.some((p) => p.url === url)) {
          pool.push({ url, name: `Custom-${i + 1}` });
        }
      });
    }

    if (ENV.AVALANCHE_FALLBACK_RPCS) {
      const extras = ENV.AVALANCHE_FALLBACK_RPCS.split(',').map((u) => u.trim()).filter(Boolean);
      extras.forEach((url, i) => {
        if (!pool.some((p) => p.url === url)) {
          pool.push({ url, name: `Fallback-${i + 1}` });
        }
      });
    }

    // Deduplicate pool
    const seen = new Set<string>();
    this.candidateEndpoints = pool.filter((p) => {
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });

    // Initialize sub-providers
    this.candidateEndpoints.forEach((ep) => {
      this.subProviders.set(ep.url, new ethers.JsonRpcProvider(ep.url, 43113, { staticNetwork: true }));
      this.statusMap.set(ep.url, {
        url: ep.url,
        name: ep.name,
        isHealthy: true,
      });
    });
  }

  /**
   * Overridden send method: Dispatches JSON-RPC payload through candidate pool
   * with strict timeout race (<= 1800ms per node) and instant failover.
   */
  async send(method: string, params: Array<any> | Record<string, any>): Promise<any> {
    const startIndex = this.activeIndex;
    let lastError: any = null;

    for (let attempt = 0; attempt < this.candidateEndpoints.length; attempt++) {
      const idx = (startIndex + attempt) % this.candidateEndpoints.length;
      const endpoint = this.candidateEndpoints[idx];
      const t0 = performance.now();

      try {
        const result = await this.executeCallWithTimeout(endpoint.url, method, params, this.timeoutMs);
        const latency = Math.round(performance.now() - t0);
        this.updateStatus(endpoint.url, true, latency);

        // If we succeeded on a backup node, update activeIndex
        if (this.activeIndex !== idx) {
          console.log(`🔀 [ResilientRpc] Switched active RPC to ${endpoint.name} (${endpoint.url})`);
          this.activeIndex = idx;
        }

        return result;
      } catch (err: any) {
        const latency = Math.round(performance.now() - t0);
        this.updateStatus(endpoint.url, false, latency);
        console.warn(
          `⚠️ [ResilientRpc] Node "${endpoint.name}" (${endpoint.url}) failed or timed out (${latency}ms) on ${method}: ${err.message}. Failing over...`
        );
        lastError = err;
      }
    }

    throw new Error(
      `All ${this.candidateEndpoints.length} resilient RPC endpoints failed for ${method}. Last error: ${lastError?.message}`
    );
  }

  /**
   * Dispatches a single RPC call with strict millisecond timeout race
   */
  private async executeCallWithTimeout(
    url: string,
    method: string,
    params: Array<any> | Record<string, any>,
    timeoutMs: number
  ): Promise<any> {
    const subProvider = this.subProviders.get(url)!;

    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`RPC request ${method} timed out after ${timeoutMs}ms SLA limit`));
      }, timeoutMs);
    });

    try {
      const callPromise = subProvider.send(method, params);
      return await Promise.race([callPromise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  private updateStatus(url: string, isHealthy: boolean, latencyMs: number) {
    const existing = this.statusMap.get(url);
    if (existing) {
      existing.isHealthy = isHealthy;
      existing.lastLatencyMs = latencyMs;
      existing.lastChecked = Date.now();
    }
  }

  /**
   * Return currently active endpoint name and URL for Presenter HUD
   */
  getActiveEndpoint(): { url: string; name: string; latencyMs?: number } {
    const ep = this.candidateEndpoints[this.activeIndex] || this.candidateEndpoints[0];
    const status = this.statusMap.get(ep.url);
    return {
      url: ep.url,
      name: ep.name,
      latencyMs: status?.lastLatencyMs,
    };
  }

  /**
   * Formatted status label for HUD (e.g. "🟢 RPC: Official Fuji (24ms)")
   */
  getActiveEndpointLabel(): string {
    const ep = this.getActiveEndpoint();
    const status = this.statusMap.get(ep.url);
    const icon = status?.isHealthy ? '🟢' : '🟡';
    const latencyStr = status?.lastLatencyMs !== undefined ? ` (${status.lastLatencyMs}ms)` : '';
    return `${icon} RPC: ${ep.name}${latencyStr}`;
  }

  /**
   * Query status of all candidate endpoints for stage pre-flight check
   */
  async pingAll(timeoutLimitMs: number = 1500): Promise<RpcEndpointStatus[]> {
    const results: RpcEndpointStatus[] = [];

    await Promise.all(
      this.candidateEndpoints.map(async (ep) => {
        const t0 = performance.now();
        try {
          await this.executeCallWithTimeout(ep.url, 'eth_blockNumber', [], timeoutLimitMs);
          const latency = Math.round(performance.now() - t0);
          this.updateStatus(ep.url, true, latency);
          results.push({
            url: ep.url,
            name: ep.name,
            isHealthy: true,
            lastLatencyMs: latency,
            lastChecked: Date.now(),
          });
        } catch (err) {
          const latency = Math.round(performance.now() - t0);
          this.updateStatus(ep.url, false, latency);
          results.push({
            url: ep.url,
            name: ep.name,
            isHealthy: false,
            lastLatencyMs: latency,
            lastChecked: Date.now(),
          });
        }
      })
    );

    return results;
  }
}

export const resilientRpcProvider = new ResilientRpcProvider();
