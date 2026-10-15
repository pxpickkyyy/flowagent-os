export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  timeoutMs: number;
  failureThreshold: number;
  cooldownMs: number;
  name?: string;
}

export interface CircuitExecutionResult<T> {
  result: T;
  degraded: boolean;
  durationMs: number;
  state: CircuitState;
  error?: string;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures: number = 0;
  private lastStateChange: number = Date.now();
  private readonly options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      timeoutMs: options.timeoutMs ?? 1200,
      failureThreshold: options.failureThreshold ?? 2,
      cooldownMs: options.cooldownMs ?? 15000,
      name: options.name ?? 'GenericCircuitBreaker',
    };
  }

  getState(): CircuitState {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastStateChange;
      if (elapsed >= this.options.cooldownMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
    return this.state;
  }

  private transitionTo(newState: CircuitState) {
    console.log(`⚡ [CircuitBreaker:${this.options.name}] State transition: ${this.state} -> ${newState}`);
    this.state = newState;
    this.lastStateChange = Date.now();
    if (newState === 'CLOSED') {
      this.consecutiveFailures = 0;
    }
  }

  /**
   * Execute an asynchronous task protected by timeout race and failure threshold.
   * If circuit is OPEN, returns fallback immediately without blocking.
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    overrideTimeoutMs?: number
  ): Promise<CircuitExecutionResult<T>> {
    const currentState = this.getState();
    const effectiveTimeout = overrideTimeoutMs ?? this.options.timeoutMs;
    const t0 = performance.now();

    // 1. Fast path: If OPEN, degrade immediately
    if (currentState === 'OPEN') {
      const durationMs = Math.round(performance.now() - t0);
      return {
        result: fallbackValue,
        degraded: true,
        durationMs,
        state: 'OPEN',
        error: `Circuit breaker [${this.options.name}] is OPEN. Fast-falling back to preserve SLA.`,
      };
    }

    // 2. Race operation against strict timeout SLA
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Timeout limit of ${effectiveTimeout}ms exceeded`));
      }, effectiveTimeout);
    });

    try {
      const res = await Promise.race([operation(), timeoutPromise]);
      clearTimeout(timer!);

      const durationMs = Math.round(performance.now() - t0);
      if (this.state === 'HALF_OPEN') {
        this.transitionTo('CLOSED');
      }
      this.consecutiveFailures = 0;

      return {
        result: res,
        degraded: false,
        durationMs,
        state: this.state,
      };
    } catch (err: any) {
      clearTimeout(timer!);
      const durationMs = Math.round(performance.now() - t0);
      this.consecutiveFailures++;

      // Check for HTTP 429 (rate limit) or threshold breach
      const isRateLimited =
        err?.status === 429 ||
        err?.response?.status === 429 ||
        String(err?.message || '').includes('429') ||
        String(err?.message || '').toLowerCase().includes('quota') ||
        String(err?.message || '').toLowerCase().includes('rate limit');

      if (isRateLimited || this.consecutiveFailures >= this.options.failureThreshold) {
        this.transitionTo('OPEN');
      }

      console.warn(
        `⚠️ [CircuitBreaker:${this.options.name}] Degraded (${durationMs}ms): ${err.message}. Serving fallback without blocking.`
      );

      return {
        result: fallbackValue,
        degraded: true,
        durationMs,
        state: this.state,
        error: err.message,
      };
    }
  }

  /**
   * Reset breaker to CLOSED manually
   */
  reset() {
    this.transitionTo('CLOSED');
  }

  /**
   * Force trip to OPEN for testing or simulated stage conditions
   */
  trip() {
    this.transitionTo('OPEN');
  }

  /**
   * Formatted status summary for Presenter HUD
   */
  getStatusSummary(): {
    state: CircuitState;
    label: string;
    isReady: boolean;
    consecutiveFailures: number;
  } {
    const st = this.getState();
    const isReady = st === 'CLOSED';
    return {
      state: st,
      label: isReady ? '🎙️ ElevenLabs: Ready' : '⚠️ Voice: Degraded (Text-Only)',
      isReady,
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}

/**
 * Dedicated ElevenLabs circuit breaker:
 * - 2500ms timeout (covers network latency while keeping agent responsive)
 * - Trips on 2 consecutive timeouts or 1 rate-limit (HTTP 429)
 * - 15s cooldown before probing HALF_OPEN
 */
export const elevenlabsCircuitBreaker = new CircuitBreaker({
  name: 'ElevenLabsVoice',
  timeoutMs: 2500,
  failureThreshold: 2,
  cooldownMs: 15000,
});
