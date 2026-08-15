# SellSnap — Payment Workflow Security Audit

> **Audit Date:** 2026-07-12  
> **Scope:** All files that touch money — `app/api/checkout/route.ts`, `app/api/verify-payment/route.ts`, `app/api/webhooks/flutterwave/route.ts`, `lib/flutterwave.ts`, `lib/rate-limit.ts`, `lib/payment-log.ts`, `lib/validators/checkout.ts`, `components/payment/checkout-form.tsx`, `components/payment/payment-status.tsx`, `prisma/schema.prisma`

---

## Overall Rating

| Dimension | Score |
|---|---|
| Authentication & Authorisation | 7 / 10 |
| Input Validation | 7 / 10 |
| Webhook Security | 8 / 10 |
| Race Condition / Double-spend Protection | 4 / 10 |
| Rate Limiting | 5 / 10 |
| Data Handling & Secrets | 6 / 10 |
| Error Handling & Information Leakage | 9 / 10 |
| Audit Trail | 7 / 10 |
| **Overall** | **6.5 / 10** |

The foundation is solid — proper server-side verification, timing-safe signature comparison, Zod schema validation, and structured error responses are all present. The critical gaps are a race condition that enables double-spend fraud, an in-process rate limiter that resets on every deploy, and orphaned PENDING orders that inflate the DB indefinitely.

---

## Findings

### 🔴 CRITICAL — C1: Double-spend / TOCTOU Race Condition in the Webhook

**File:** `app/api/webhooks/flutterwave/route.ts` — lines 108–163

**The problem:**

```ts
// Step 1 — mark as PAID
const updated = await prisma.order.updateMany({
  where: { id: txRef, status: 'PENDING' },
  data: { status: 'PAID', flutterwaveId },
})

// Step 2 — read the order back to check amounts
const order = await prisma.order.findUnique({ where: { id: txRef } })

// Step 3 — if amounts don't match, flip back to FAILED
if (!amountsOk || !currenciesMatch) {
  await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } })
}
```

There are **two separate round-trips** with a gap between them. In that gap, the order is in the `PAID` state. If the seller dashboard polls between step 1 and step 3, the seller sees a `PAID` order for an amount that is actually wrong, ships the goods, and then the order flips to `FAILED`. This is a classic **check-then-act** race.

Additionally, Flutterwave may send the same webhook event more than once. Even though `updateMany` with `status: 'PENDING'` prevents double-marking, the log + rollback path inside the `if (order)` block still executes for every duplicate delivery, creating noisy log entries and unnecessary DB writes.

**Remediation:** Do the amount/currency check **before** writing to the DB. Only mark as `PAID` after all checks pass:

```ts
// Correct order of operations
const order = await prisma.order.findUnique({ where: { id: txRef, status: 'PENDING' } })
if (!order) return NextResponse.json({ ok: true }) // already processed or not found

const amountsOk = amountsMatch(Number(webhookData.amount), order.totalAmount)
const currenciesMatch = webhookData.currency === order.currency

if (!amountsOk || !currenciesMatch) {
  await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } })
  await logPaymentEvent(...)
  return NextResponse.json({ ok: true })
}

// Only now mark PAID — single atomic write
await prisma.order.updateMany({
  where: { id: txRef, status: 'PENDING' }, // idempotency guard
  data: { status: 'PAID', flutterwaveId },
})
```

---

### 🔴 CRITICAL — C2: Orphaned PENDING Orders Are Never Cleaned Up

**File:** `app/api/checkout/route.ts` — lines 106–132

Every call to `/api/checkout` creates an `Order` row with status `PENDING` **before** the Flutterwave call succeeds. If the Flutterwave API call fails (line 139), the order stays `PENDING` forever. With 10 requests/minute per IP allowed, an attacker can freely inflate the orders table with tens of thousands of rows in hours.

More subtly: a legitimate buyer who opens the product page multiple times or refreshes during checkout also creates multiple PENDING orders, polluting the seller's order dashboard.

**Remediation:**
1. Catch the Flutterwave error and immediately mark the created order `FAILED`:
```ts
let order: Order | null = null
try {
  order = await prisma.order.create(...)
  const paymentLink = await createFlutterwavePaymentLink(...)
  return NextResponse.json({ ok: true, data: { orderId: order.id, paymentLink } })
} catch (error) {
  if (order) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } })
  }
  throw error
}
```
2. Add a scheduled cleanup job (or a Prisma migration-level partial index) that marks orders as `EXPIRED` after 2 hours if still `PENDING`.

---

### 🟠 HIGH — H1: In-Process Rate Limiter Resets on Every Deploy / Is Per-Instance

**File:** `lib/rate-limit.ts` — line 11

```ts
const store = new Map<string, RateLimitEntry>()
```

The rate-limit state lives in Node.js process memory. This means:
- Every **deployment or server restart** resets all counters to zero — an attacker who monitors your deploy cadence gets a free bypass window.
- In any **multi-instance** deployment (two serverless workers, any horizontal scaling), each process has its own counter, so the real limit is `maxRequests × instanceCount`.
- On serverless platforms (Vercel, etc.), **each request may spin up a cold instance** — the rate limiter is completely ineffective.

**Remediation:** Replace with a Redis-backed or database-backed rate limiter. If Redis is not available, use Vercel's `@upstash/ratelimit` with the Redis edge adapter — it's a drop-in replacement that requires no infrastructure changes.

---

### 🟠 HIGH — H2: `getClientIp` Trusts `X-Forwarded-For` Without Proxy Verification

**File:** `lib/rate-limit.ts` — lines 60–73

```ts
const forwarded = request.headers.get('x-forwarded-for')
if (forwarded && IP_HEADER_REGEX.test(forwarded)) {
  const firstIp = forwarded.split(',')[0]?.trim()
```

Any client can send `X-Forwarded-For: 1.2.3.4` in their request. Without knowing whether the request has actually passed through a trusted proxy that set this header, you are reading **attacker-controlled input as the client's real IP**. This completely defeats rate limiting and webhook IP allowlisting — an attacker can cycle IPs trivially by changing the header value.

**Remediation:** Only trust `X-Forwarded-For` if you know the deployment platform sets it reliably and clients cannot fake it (e.g., Vercel sets `x-forwarded-for` and strips client-supplied duplicates). Document which header your deployment platform is authoritative for and only read that one. For Vercel, use `request.ip` from the Next.js request context (available in Edge middleware) or the `x-real-ip` header that Vercel injects authoritatively.

---

### 🟠 HIGH — H3: `FLW_WEBHOOK_IPS` Defaults to "Allow All" When Unset

**File:** `app/api/webhooks/flutterwave/route.ts` — lines 41–43

```ts
function isAllowedWebhookIp(ip: string): boolean {
  const allowedIps = process.env.FLW_WEBHOOK_IPS
  if (!allowedIps) return true   // ← open to everyone when env var is missing
```

If the environment variable is not set (which it isn't — it's absent from `.env`), every IP in the world is allowed through to signature verification. While the signature check is the real gate, this is defence-in-depth that is silently disabled with no warning.

**Remediation:** Fail closed — log a warning and still allow through (since the signature is the real guard), but make it visible:
```ts
if (!allowedIps) {
  console.warn('FLW_WEBHOOK_IPS is not set — skipping IP allowlist. Set this in production.')
  return true
}
```
And add `FLW_WEBHOOK_IPS` to your `.env.example`/documentation as a required production variable.

---

### 🟡 MEDIUM — M1: Verify-Payment Is a Public Oracle With No Auth

**File:** `app/api/verify-payment/route.ts`

`GET /api/verify-payment?transaction_id=X&tx_ref=Y` is a public endpoint that:
1. Reveals whether an order ID exists (`NOT_FOUND` vs. `PAID/VERIFIED/FAILED`)
2. Makes an outbound call to Flutterwave's API for **every** request while the order is `PENDING`

An attacker can enumerate order IDs (they are CUIDs — hard to guess but not impossible at scale) and repeatedly call this endpoint to probe order status and burn through your Flutterwave API quota. The 30 req/min IP limit only partially mitigates this since the in-process limiter can be bypassed (see H1/H2).

**Remediation:**
- Rate-limit by `tx_ref` key in addition to IP: `verify:${txRef}:${ip}` with a tighter window (e.g., 5 requests per 30 seconds per order)
- Return a generic `NOT_FOUND` response for both "order doesn't exist" and "order belongs to a different session" to prevent enumeration

---

### 🟡 MEDIUM — M2: Redirect URL in Checkout Is Not Validated

**File:** `app/api/checkout/route.ts` — line 136

```ts
const redirectUrl = `${appUrl}/p/${product.slug}?paid=true`
```

`product.slug` comes from the database, which is safe. However, `appUrl` comes from `process.env.APP_URL`. If this environment variable were ever misconfigured (e.g., set to an attacker-controlled domain), the redirect URL sent to Flutterwave would point to the wrong host. After payment, buyers would be redirected to an attacker's site.

**Remediation:** Hardcode the redirect URL format with explicit validation:
```ts
const APP_URL = process.env.APP_URL
if (!APP_URL || !URL.canParse(APP_URL)) throw new Error('APP_URL is not configured')
const parsed = new URL(APP_URL)
// Enforce it's your own domain
const redirectUrl = `${parsed.origin}/p/${product.slug}?paid=true`
```

---

### 🟡 MEDIUM — M3: SQLite in Production Is a Single Point of Failure

**File:** `lib/db.ts` — line 7, `prisma/schema.prisma` — line 6

```ts
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
```
```
datasource db { provider = "sqlite" }
```

The database path is **hardcoded** to `./dev.db` and ignores `DATABASE_URL` entirely. This means:
- Production and development share the same database configuration
- The file path is relative to the process working directory — on serverless platforms, it points to the ephemeral filesystem and **all data is lost on every cold start**
- There is no connection pooling, WAL mode configuration, or read replica — concurrent writes (simultaneous webhooks, for example) will serialize and may deadlock under load

**Remediation:** Switch to PostgreSQL for production as the architecture documentation specifies. The `DATABASE_URL` env var is already set. Update the schema and `db.ts` to use the standard Prisma PostgreSQL driver that reads `DATABASE_URL`.

---

### 🟡 MEDIUM — M4: `amountsMatch` Uses Floating-Point Rounding

**File:** `lib/flutterwave.ts` — lines 37–39

```ts
export function amountsMatch(fwAmount: number, orderAmountKobo: number): boolean {
  const fwInKobo = Math.round(fwAmount * 100)
  return fwInKobo === orderAmountKobo
}
```

Flutterwave returns amounts as JSON numbers. For amounts like `₦1,000.01`, `fwAmount * 100` may produce `100000.99999999999` or `100001.00000000001` due to IEEE 754 floating-point representation. `Math.round` handles this correctly in most cases, but amounts near `.005` boundaries can round the wrong way depending on the mantissa.

**Remediation:** Use integer arithmetic exclusively. Parse `fwAmount` as a string, split at the decimal, and compute kobo directly:
```ts
function toKobo(amount: number): number {
  // Avoid floating point by working through the string representation
  return Math.round(Number(amount.toFixed(2)) * 100)
}
```
Or use a library like `decimal.js` for financial arithmetic.

---

### 🟢 LOW — L1: Checkout Creates Order Before Confirming Flutterwave Reachability

**File:** `app/api/checkout/route.ts` — lines 106–153

The DB write happens at line 106, the Flutterwave API call at line 139. If Flutterwave is down, the buyer sees an error but an orphaned `PENDING` order exists in the DB. (This partially overlaps with C2, but the availability aspect is distinct — you should probe Flutterwave reachability before committing the order.)

---

### 🟢 LOW — L2: Payment Log `metadata` Field Is an Unbounded String

**File:** `lib/payment-log.ts` — line 23

```ts
metadata: data.metadata ? JSON.stringify(data.metadata) : null,
```

`metadata` is logged as raw JSON with no size limit. A caller could inadvertently log very large objects (e.g., the full Flutterwave response body), causing individual rows in `payment_logs` to grow to megabytes. Add a size cap:
```ts
const raw = JSON.stringify(data.metadata)
metadata: raw.length > 10_000 ? raw.slice(0, 10_000) + '…[truncated]' : raw
```

---

### 🟢 LOW — L3: `FLW_SECRET_KEY` Logged on Error

**File:** `app/api/checkout/route.ts` — line 32

```ts
console.error('Flutterwave /payments error:', JSON.stringify(data))
```

If Flutterwave returns your key in an error response (some gateway errors do echo back request fields), the secret key would appear in server logs. Always redact secret fields before logging external API responses.

---

### ℹ️ INFO — I1: No CSRF Protection on `/api/checkout`

The checkout endpoint accepts cross-origin `POST` requests from any domain because Next.js route handlers do not enforce `SameSite` on API routes. A malicious website could embed a form that submits to `/api/checkout` and initiate an order on behalf of a victim — though the buyer would need to complete payment on Flutterwave's hosted page anyway. Impact is low but real (order spam, email farming).

**Remediation:** Add an `Origin` header check that rejects requests from origins other than `APP_URL`.

---

### ℹ️ INFO — I2: Buyer Email Not Normalised Before Storage

**File:** `app/api/checkout/route.ts` — line 108

`buyerEmail` is stored as-is after Zod validates it as a syntactically valid email. `User@Example.COM` and `user@example.com` are the same RFC 5321 address but would be stored as two different strings, causing duplicate buyer records in analytics.

**Remediation:** `buyerEmail.trim().toLowerCase()` before storing.

---

## What Is Done Well ✅

| What | Where |
|---|---|
| Server-side verification of every payment — browser redirect not trusted | `verify-payment/route.ts`, `webhooks/flutterwave/route.ts` |
| Timing-safe signature comparison for webhook | `lib/flutterwave.ts:65` |
| Zod schema with `.strip()` prevents unknown field injection | `lib/validators/checkout.ts` |
| Prisma parameterised queries throughout — no SQL injection surface | All DB calls |
| Sanitised error responses — stack traces and Prisma errors never reach the client | All route handlers |
| `httpOnly`/`secure`/`sameSite` session cookies | `lib/auth.ts:73–79` |
| PBKDF2-SHA512 with 600,000 iterations for password hashing | `lib/auth.ts:15` |
| Idempotency guard on `updateMany` with `status: 'PENDING'` | `webhooks/flutterwave/route.ts:109` |
| Payment audit log for every event | `lib/payment-log.ts` |
| Amount + currency + tx_ref triple-check in verify-payment | `verify-payment/route.ts:72–75` |
| `paymentLink` origin validated (must start with `https://`) | `checkout/route.ts:37` |

---

## Remediation Priority

| Priority | Finding | Effort |
|---|---|---|
| 🔴 Fix immediately | C1 — Webhook TOCTOU double-spend | ~30 min |
| 🔴 Fix immediately | C2 — Orphaned PENDING orders | ~1 hour |
| 🟠 Fix before production | H1 — In-process rate limiter | ~2 hours |
| 🟠 Fix before production | H2 — IP spoofing via X-Forwarded-For | ~30 min |
| 🟠 Fix before production | H3 — Webhook IP allowlist silent fail-open | ~15 min |
| 🟠 Fix before production | M3 — SQLite hardcoded in production | ~2 hours |
| 🟡 Fix in next sprint | M1 — Verify-payment oracle | ~1 hour |
| 🟡 Fix in next sprint | M2 — Redirect URL validation | ~15 min |
| 🟡 Fix in next sprint | M4 — Floating-point amount comparison | ~30 min |
| 🟢 Nice to have | L1, L2, L3, I1, I2 | ~2 hours total |
