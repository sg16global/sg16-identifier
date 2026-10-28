import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/*
 * Database access for both runtimes.
 *
 * Node (`next start`): one pool for the whole process, as before.
 *
 * Cloudflare Workers: a socket belongs to the request that opened it — a pool
 * shared across requests makes the second request hang until the runtime
 * cancels it. So each request gets its own pool, keyed by the per-request
 * Cloudflare context and dropped with it. Behind Hyperdrive (Cloudflare's
 * Postgres connection pooler, bound as HYPERDRIVE in wrangler.jsonc) these
 * per-request connections are cheap; without it, DATABASE_URL is used directly.
 */

const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

function connectionString(env?: unknown): string {
  const hyperdrive = (env as { HYPERDRIVE?: { connectionString?: string } } | undefined)?.HYPERDRIVE;
  const url = hyperdrive?.connectionString ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return url;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function processPool(): Pool {
  const pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({ connectionString: connectionString() });
  // Cached on globalThis in production too, so it is created once per process.
  globalForDb.__arenaNextJsPostgresqlPool = pool;
  return pool;
}

const requestDbs = new WeakMap<object, NodePgDatabase>();
let processDb: NodePgDatabase | undefined;

function currentDb(): NodePgDatabase {
  if (!onWorkers) return (processDb ??= drizzle(processPool()));
  const context = getCloudflareContext();
  let db = requestDbs.get(context);
  if (!db) {
    // One connection per request: queries within a request run in sequence.
    db = drizzle(new Pool({ connectionString: connectionString(context.env), max: 1 }));
    requestDbs.set(context, db);
  }
  return db;
}

if (!onWorkers) connectionString(); // fail fast on a misconfigured Node server, as before

/** Drizzle client for the current runtime (and, on Workers, the current request). */
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, property) {
    const instance = currentDb();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
