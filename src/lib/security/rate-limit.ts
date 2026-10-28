/**
 * Per-fingerprint sliding-window limiter + daily variable-cost budget.
 * In-memory by design for a single instance; swap for Redis without changing
 * the call sites when the service scales out (blueprint §8).
 *
 * On Cloudflare Workers this code runs unchanged (no Node APIs), but every
 * isolate keeps its own counters, so limits and the budget are per instance,
 * not global. For shared limits, back consumeRateLimit with Cloudflare's
 * Rate Limiting binding or a Durable Object, and the budget with a Durable
 * Object (KV is eventually consistent and too slow to count requests).
 */

interface WindowEntry {
  hits: number[];
}

const windows = new Map<string, WindowEntry>();
const dayBudget = { date: "", spentUsd: 0, blocked: 0 };

export interface RateLimitPolicy {
  windowMs: number;
  maxRequests: number;
}

export const POLICIES: Record<string, RateLimitPolicy> = {
  verify: { windowMs: 60_000, maxRequests: 6 },
  feedback: { windowMs: 60_000, maxRequests: 10 },
  newsletter: { windowMs: 3_600_000, maxRequests: 3 },
  affiliate: { windowMs: 60_000, maxRequests: 30 },
  certificate: { windowMs: 60_000, maxRequests: 10 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
}

export function consumeRateLimit(
  fingerprint: string,
  policy: RateLimitPolicy = POLICIES.verify,
): RateLimitResult {
  const now = Date.now();
  const key = `${fingerprint}:${policy.windowMs}:${policy.maxRequests}`;
  const entry = windows.get(key) ?? { hits: [] };
  entry.hits = entry.hits.filter((t) => now - t < policy.windowMs);

  if (entry.hits.length >= policy.maxRequests) {
    windows.set(key, entry);
    const oldest = entry.hits[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1000, policy.windowMs - (now - oldest)),
      limit: policy.maxRequests,
    };
  }

  entry.hits.push(now);
  windows.set(key, entry);
  if (windows.size > 5000) {
    // crude eviction: drop stale keys
    for (const [k, v] of windows) {
      if (v.hits.every((t) => now - t > policy.windowMs)) windows.delete(k);
      if (windows.size < 3000) break;
    }
  }
  return {
    allowed: true,
    remaining: policy.maxRequests - entry.hits.length,
    retryAfterMs: 0,
    limit: policy.maxRequests,
  };
}

export const DAILY_BUDGET_USD = Number(process.env.SG16_DAILY_BUDGET_USD ?? "12");

export function recordSpend(amountUsd: number) {
  const today = new Date().toISOString().slice(0, 10);
  if (dayBudget.date !== today) {
    dayBudget.date = today;
    dayBudget.spentUsd = 0;
    dayBudget.blocked = 0;
  }
  dayBudget.spentUsd += amountUsd;
}

export function budgetState() {
  const today = new Date().toISOString().slice(0, 10);
  if (dayBudget.date !== today) return { date: today, spentUsd: 0, blocked: 0 };
  return { ...dayBudget };
}

export function budgetExhausted(): boolean {
  return budgetState().spentUsd >= DAILY_BUDGET_USD;
}

export function noteBudgetBlock() {
  const today = new Date().toISOString().slice(0, 10);
  if (dayBudget.date !== today) {
    dayBudget.date = today;
    dayBudget.spentUsd = 0;
    dayBudget.blocked = 0;
  }
  dayBudget.blocked += 1;
}

export function requestFingerprint(headers: Headers): string {
  // Cloudflare sets cf-connecting-ip itself; x-forwarded-for can be supplied by the client.
  const forwarded = headers.get("x-forwarded-for");
  const ip = headers.get("cf-connecting-ip") ?? forwarded?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown";
  const agent = headers.get("user-agent") ?? "no-agent";
  // Hash, never store raw IP + agent (privacy default, blueprint §7)
  let h1 = 0x811c9dc5;
  const input = `${ip}|${agent.slice(0, 120)}`;
  for (let i = 0; i < input.length; i += 1) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  return `fp_${h1.toString(36)}`;
}
