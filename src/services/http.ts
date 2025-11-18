// Lightweight HTTP JSON caching helper for GET endpoints
// - In-memory Map with optional localStorage persistence
// - TTL-based freshness; returns cached value when not expired
// - Manual invalidation helpers

type CacheEntry<T = any> = { value: T; expiresAt: number };

const memoryCache = new Map<string, CacheEntry>();

function now() {
  return Date.now();
}

function readLocal<T>(key: string): CacheEntry<T> | undefined {
  try {
    const raw = localStorage.getItem(`httpcache:${key}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.expiresAt !== 'number') return undefined;
    if (parsed.expiresAt <= now()) {
      localStorage.removeItem(`httpcache:${key}`);
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function writeLocal<T>(key: string, entry: CacheEntry<T>) {
  try {
    localStorage.setItem(`httpcache:${key}`, JSON.stringify(entry));
  } catch {
    // storage full or disabled
  }
}

export type CachedJsonOptions = {
  ttlMs?: number; // default 15000 (15s)
  cacheKey?: string; // override key (defaults to URL)
  persist?: boolean; // also store in localStorage
  noCache?: boolean; // bypass cache entirely
  fetchInit?: RequestInit; // optional fetch options
};

export async function fetchJsonCached<T = any>(url: string, opts: CachedJsonOptions = {}): Promise<T> {
  const ttlMs = typeof opts.ttlMs === 'number' ? opts.ttlMs : 15000;
  const key = opts.cacheKey || url;

  if (!opts.noCache && ttlMs > 0) {
    const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (mem && mem.expiresAt > now()) {
      return structuredClone(mem.value);
    }
    if (!mem && opts.persist) {
      const loc = readLocal<T>(key);
      if (loc && loc.expiresAt > now()) {
        // hydrate memory and return
        memoryCache.set(key, loc);
        return structuredClone(loc.value);
      }
    }
  }

  const res = await fetch(url, opts.fetchInit);
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as T;

  if (!opts.noCache && ttlMs > 0) {
    const entry: CacheEntry<T> = { value: data, expiresAt: now() + ttlMs };
    memoryCache.set(key, entry);
    if (opts.persist) writeLocal(key, entry);
  }
  return data;
}

export function invalidateCache(prefix?: string) {
  const p = prefix || '';
  for (const k of Array.from(memoryCache.keys())) {
    if (!p || k.startsWith(p)) memoryCache.delete(k);
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const del: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith('httpcache:')) {
          const clean = key.replace('httpcache:', '');
          if (!p || clean.startsWith(p)) del.push(key);
        }
      }
      del.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }
}
