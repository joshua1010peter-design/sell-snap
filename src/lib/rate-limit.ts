import { prisma } from '@/lib/db'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + config.windowMs)

  try {
    // Try to find an existing entry
    const existing = await prisma.rateLimit.findUnique({ where: { key } })

    if (!existing || now > existing.resetAt) {
      // Window expired or no entry — start fresh
      const entry = await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      })
      return { allowed: true, remaining: config.maxRequests - 1, resetAt: entry.resetAt }
    }

    if (existing.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt }
    }

    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: existing.count + 1 },
    })

    return {
      allowed: true,
      remaining: config.maxRequests - updated.count,
      resetAt: updated.resetAt,
    }
  } catch {
    // If DB is unreachable, fail open (allow the request) rather than blocking all traffic
    return { allowed: true, remaining: config.maxRequests, resetAt: resetAt }
  }
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({
      where: { resetAt: { lt: new Date() } },
    })
  } catch {
    // Silent — cleanup is best-effort
  }
}

// H2: Only trust headers injected by the deployment platform.
// On Vercel, x-forwarded-for is set authoritatively and client-supplied duplicates are stripped.
// We prefer x-real-ip (set by Vercel's proxy) and fall back to x-forwarded-for only if it
// passes a strict IP-only format check (no commas = single IP, meaning no client spoofing chain).
const STRICT_IP = /^[\d.:a-fA-F]{7,45}$/

export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp && STRICT_IP.test(realIp)) {
    return realIp
  }

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded && STRICT_IP.test(forwarded)) {
    // Single IP — safe to trust (proxy stripped client-supplied duplicates)
    return forwarded.trim()
  }
  // Multi-value x-forwarded-for may be client-spoofed; don't trust it
  return '127.0.0.1'
}
