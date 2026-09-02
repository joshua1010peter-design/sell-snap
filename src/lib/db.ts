import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    try {
      const { PrismaPg } = require('@prisma/adapter-pg')
      const { Pool } = require('pg')
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
      })
      const adapter = new PrismaPg(pool)
      console.log('[db] PrismaClient initialized with PostgreSQL adapter')
      return new PrismaClient({ adapter })
    } catch (e) {
      console.error('[db] Failed to initialize Prisma with pg adapter:', e instanceof Error ? e.message : e)
      throw e
    }
  }

  // SQLite local development (Prisma 7 requires driver adapter)
  try {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
    const url = dbUrl || 'file:./dev.db'
    const adapter = new PrismaBetterSqlite3({ url })
    console.log('[db] PrismaClient initialized with SQLite adapter')
    return new PrismaClient({ adapter })
  } catch (e) {
    console.error('[db] Failed to initialize Prisma with better-sqlite3 adapter:', e instanceof Error ? e.message : e)
    throw e
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

