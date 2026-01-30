const MAX_CACHE_SIZE = 500;

export class ParserCache<T> {
  private globalCache = new Map<string, T>();
  private elementCache = new WeakMap<Element, T>();

  get(key: string, element?: Element): T | undefined {
    if (element) {
      const cached = this.elementCache.get(element);
      if (cached) return cached;
    }

    const cached = this.globalCache.get(key);
    if (cached) {
      // Move to end for LRU
      this.globalCache.delete(key);
      this.globalCache.set(key, cached);
      return cached;
    }

    return undefined;
  }

  set(key: string, value: T, element?: Element): void {
    // Evict oldest if over limit
    if (this.globalCache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.globalCache.keys().next().value;
      if (firstKey !== undefined) this.globalCache.delete(firstKey);
    }

    this.globalCache.set(key, value);

    if (element) {
      this.elementCache.set(element, value);
    }
  }

  invalidateElement(element: Element): void {
    this.elementCache.delete(element);
  }
}

export const requestCache = new ParserCache<import('../types').ParsedRequest>();
export const triggerCache = new ParserCache<import('../types').ParsedTrigger>();
