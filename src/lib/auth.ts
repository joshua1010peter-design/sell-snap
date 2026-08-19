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
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } })
    }
    return null
  }

  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export async function signupUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new AppError('Email already in use', 409, 'EMAIL_EXISTS')
  }

  const passwordHash = hashPassword(password)
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  })

  await createSession(user.id)
  return user
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  if (isLegacyHash(user.passwordHash)) {
    const newHash = hashPassword(password)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })
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
