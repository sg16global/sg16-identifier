import { NextResponse } from "next/server";
import type { VerifyRequest } from "@/lib/types";
import { runVerification } from "@/lib/verification/engine";
import {
  POLICIES,
  budgetExhausted,
  consumeRateLimit,
  noteBudgetBlock,
  requestFingerprint,
} from "@/lib/security/rate-limit";
import { getFlagStates, FLAG_KEYS } from "@/lib/db/reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_CATEGORIES = new Set(["claim", "website", "product", "media", "auto"]);

export async function POST(request: Request) {
  const fingerprint = requestFingerprint(request.headers);
  const limit = consumeRateLimit(fingerprint, POLICIES.verify);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Rate limit reached (${limit.limit} checks per minute). Retry in ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
        retryAfterMs: limit.retryAfterMs,
      },
      { status: 429, headers: { "retry-after": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  let body: VerifyRequest;
  try {
    body = (await request.json()) as VerifyRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body.input !== "string" && !body.file) {
    return NextResponse.json({ ok: false, error: "Field 'input' must be a string." }, { status: 400 });
  }
  if (body.category && !ALLOWED_CATEGORIES.has(body.category)) {
    return NextResponse.json({ ok: false, error: `Unknown category "${body.category}".` }, { status: 400 });
  }
  if ((body.input ?? "").length > 20000) {
    return NextResponse.json({ ok: false, error: "Input exceeds 20,000 characters." }, { status: 413 });
  }

  const flags = await getFlagStates();
  if (flags[FLAG_KEYS.intake] === false) {
    return NextResponse.json(
      { ok: false, error: "Public intake is temporarily paused by the operator. Existing reports remain available." },
      { status: 503 },
    );
  }
  if (budgetExhausted()) {
    noteBudgetBlock();
    return NextResponse.json(
      { ok: false, error: "Today's variable-cost budget is exhausted. Free local checks resume at 00:00 UTC." },
      { status: 429 },
    );
  }

  const result = await runVerification(body, { ipFingerprint: fingerprint });
  if (!result.ok || !result.report) {
    return NextResponse.json({ ok: false, error: result.error ?? "Verification failed." }, { status: result.status ?? 500 });
  }

  return NextResponse.json(
    { ok: true, report: result.report, rateLimit: { remaining: limit.remaining, limit: limit.limit } },
    { headers: { "cache-control": "no-store" } },
  );
}
