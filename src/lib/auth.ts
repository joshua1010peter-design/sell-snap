import { cookies } from 'next/headers'
import { prisma } from './db'
import { AppError } from './errors'
import crypto from 'crypto'

const SESSION_COOKIE = 'sell_snap_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const PBKDF2_ITERATIONS = 600_000
const PBKDF2_KEY_LENGTH = 64

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha512')
    .toString('hex')
  return `${salt}:${PBKDF2_ITERATIONS}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(':')
    if (parts.length === 3) {
      const [salt, iterationsStr, hash] = parts
      const iterations = parseInt(iterationsStr, 10)
      if (!salt || !hash || isNaN(iterations)) return false

      const verify = crypto
        .pbkdf2Sync(password, salt, iterations, PBKDF2_KEY_LENGTH, 'sha512')
        .toString('hex')

      const hashBuf = Buffer.from(hash, 'hex')
      const verifyBuf = Buffer.from(verify, 'hex')

      if (hashBuf.length !== verifyBuf.length) return false
      return crypto.timingSafeEqual(hashBuf, verifyBuf)
    }

    if (parts.length === 2) {
      const [salt, hash] = parts
      if (!salt || !hash) return false

      const verify = crypto
        .pbkdf2Sync(password, salt, 1000, PBKDF2_KEY_LENGTH, 'sha512')
        .toString('hex')

      const hashBuf = Buffer.from(hash, 'hex')
      const verifyBuf = Buffer.from(verify, 'hex')

      if (hashBuf.length !== verifyBuf.length) return false
      return crypto.timingSafeEqual(hashBuf, verifyBuf)
    }

    return false
  } catch (err) {
    console.error('[auth] Password verification error:', err)
    return false
  }
}

function isLegacyHash(stored: string): boolean {
  return stored.split(':').length === 2
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createSession(userId: string) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await prisma.session.create({
    data: { userId, token, expiresAt },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        try {
          await prisma.session.delete({ where: { id: session.id } })
        } catch {
          // Cleanup is best-effort
        }
      }
      return null
    }

    return session
  } catch (err) {
    console.error('[auth] Error retrieving session:', err)
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export async function signupUser(name: string, email: string, password: string) {
  let existing
  try {
    existing = await prisma.user.findUnique({ where: { email } })
  } catch (dbErr) {
    console.error('[auth] Database query failed during signup:', dbErr)
    throw new AppError('Unable to connect to database. Please check your database URL.', 503, 'DATABASE_ERROR')
  }

  if (existing) {
    throw new AppError('Email already in use', 409, 'EMAIL_EXISTS')
  }

  const passwordHash = hashPassword(password)
  let user
  try {
    user = await prisma.user.create({
      data: { name, email, passwordHash },
    })
  } catch (createErr) {
    console.error('[auth] User creation failed:', createErr)
    throw new AppError('Failed to create account. Please ensure database tables exist.', 500, 'USER_CREATE_ERROR')
  }

  await createSession(user.id)
  return user
}

export async function loginUser(email: string, password: string) {
  let user
  try {
    user = await prisma.user.findUnique({ where: { email } })
  } catch (dbErr) {
    console.error('[auth] Database query failed during login:', dbErr)
    throw new AppError('Unable to connect to database. Please check your database connection.', 503, 'DATABASE_ERROR')
  }

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  if (isLegacyHash(user.passwordHash)) {
    const newHash = hashPassword(password)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      })
    } catch (updateErr) {
      console.warn('[auth] Failed to update legacy hash:', updateErr)
    }
  }

  await createSession(user.id)
  return user
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD')
  }

  const newHash = hashPassword(newPassword)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  })

  await prisma.session.deleteMany({ where: { userId } })
}

export async function logoutUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
  cookieStore.delete(SESSION_COOKIE)
}
