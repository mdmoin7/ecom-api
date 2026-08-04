/**
 * Small process-local TTL cache for data that is cheap to recreate but read
 * frequently. Values are cloned on both writes and reads so a caller cannot
 * accidentally mutate a cached value shared by a later request.
 */
export default class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  get(key: string): T | undefined {
    if (this.ttlMs <= 0) return undefined;

    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    // Keep recently used entries at the end of the map for simple LRU eviction.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return structuredClone(entry.value);
  }

  set(key: string, value: T): void {
    if (this.ttlMs <= 0 || this.maxEntries <= 0) return;

    this.entries.delete(key);
    this.entries.set(key, {
      value: structuredClone(value),
      expiresAt: Date.now() + this.ttlMs,
    });

    if (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) this.entries.delete(oldestKey);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
