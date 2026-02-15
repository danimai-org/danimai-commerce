export interface RateLimitStore {
    get(key: string): Promise<number>;
    set(key: string, value: number): Promise<void>;
    delete(key: string): Promise<void>;
    increment(key: string): Promise<number>;
    decrement(key: string): Promise<number>;
    reset(key: string): Promise<void>;
}

export class MemoryRateLimitStore implements RateLimitStore {
    private store: Map<string, number> = new Map();

    async get(key: string): Promise<number> {
        return this.store.get(key) ?? 0;
    }

    async set(key: string, value: number): Promise<void> {
        this.store.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async increment(key: string): Promise<number> {
        const n = (this.store.get(key) ?? 0) + 1;
        this.store.set(key, n);
        return n;
    }

    async decrement(key: string): Promise<number> {
        const n = Math.max(0, (this.store.get(key) ?? 0) - 1);
        this.store.set(key, n);
        return n;
    }

    async reset(key: string): Promise<void> {
        this.store.delete(key);
    }
}

export interface RateLimitOptions {
    /** Window duration in ms (default 15 minutes). */
    windowMs?: number;
    /** Max attempts per window (default 5). */
    maxAttempts?: number;
}

export class RateLimit {
    private readonly windowMs: number;
    private readonly maxAttempts: number;

    constructor(
        private readonly store: RateLimitStore = new MemoryRateLimitStore(),
        options: RateLimitOptions = {}
    ) {
        this.windowMs = options.windowMs ?? 15 * 60 * 1000;
        this.maxAttempts = options.maxAttempts ?? 5;
    }

    private keyWithWindow(key: string): string {
        const slot = Math.floor(Date.now() / this.windowMs);
        return `${key}:${slot}`;
    }

    /**
     * Record one attempt for the key. Returns whether the request is rate-limited
     * and how many attempts remain in the current window.
     */
    async consume(key: string): Promise<{ limited: boolean; remaining: number }> {
        const k = this.keyWithWindow(key);
        const count = await this.store.increment(k);
        const limited = count > this.maxAttempts;
        const remaining = Math.max(0, this.maxAttempts - count);
        return { limited, remaining };
    }
}