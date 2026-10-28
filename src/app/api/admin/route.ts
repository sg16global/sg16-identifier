import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { auditEvents, feedback, providerUsage } from "@/db/schema";
import {
  FLAG_KEYS,
  adminStats,
  ensureFlagsSeeded,
  listFeedback,
  listRecentAudit,
  purgeExpiredReports,
  setFlag,
} from "@/lib/db/reports";
import { ensureCatalogSeeded } from "@/lib/verification/modules/product";
import { budgetState, DAILY_BUDGET_USD } from "@/lib/security/rate-limit";
import { newId } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// No fallback: without ADMIN_ACCESS_CODE the console is closed to everyone. A
// default code would be public (it is printed in .env.example).
const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE ?? "";

function authorized(request: Request): boolean {
  // Header only: a code in the URL would be written to server and CDN logs.
  const supplied = request.headers.get("x-sg16-admin") ?? "";
  if (!ADMIN_CODE || !supplied) return false;
  const a = new TextEncoder().encode(supplied);
  const b = new TextEncoder().encode(ADMIN_CODE);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Administrator access code required." }, { status: 401 });
  }
  await ensureFlagsSeeded();

  const [stats, fb, audit, recentUsage] = await Promise.all([
    adminStats(),
    listFeedback(),
    listRecentAudit(30),
    db.select().from(providerUsage).orderBy(sql`created_at desc`).limit(40),
  ]);

  const spend = await db
    .select({
      total: sql<number>`coalesce(sum(cost_usd),0)::float`,
      calls: sql<number>`count(*)::int`,
      errors: sql<number>`coalesce(sum(case when status = 'error' then 1 else 0 end),0)::int`,
    })
    .from(providerUsage);

  return NextResponse.json({
    ok: true,
    stats,
    feedback: fb,
    audit,
    recentUsage,
    spend: spend[0],
    budget: { dailyUsd: DAILY_BUDGET_USD, ...budgetState() },
    retentionDays: Number(process.env.SG16_RETENTION_DAYS ?? "30"),
    flags: Object.values(FLAG_KEYS),
  }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Administrator access code required." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const action = String(body.action ?? "");
  const allowedKeys = Object.values(FLAG_KEYS) as string[];

  if (action === "set-flag") {
    const key = String(body.key ?? "");
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ ok: false, error: `Unknown flag "${key}".` }, { status: 400 });
    }
    await setFlag(key, Boolean(body.enabled));
    return NextResponse.json({ ok: true, key, enabled: Boolean(body.enabled) });
  }

  if (action === "seed-catalog") {
    const inserted = await ensureCatalogSeeded();
    return NextResponse.json({ ok: true, inserted });
  }

  if (action === "purge-expired") {
    const removed = await purgeExpiredReports();
    await db.insert(auditEvents).values({ id: newId(), actor: "admin", action: "purge-expired", meta: { removed } });
    return NextResponse.json({ ok: true, removed });
  }

  if (action === "resolve-feedback") {
    const id = String(body.id ?? "");
    const status = String(body.status ?? "resolved");
    await db.update(feedback).set({ status }).where(sql`${feedback.id} = ${id}`);
    return NextResponse.json({ ok: true, id, status });
  }

  return NextResponse.json({ ok: false, error: `Unknown action "${action}".` }, { status: 400 });
}
