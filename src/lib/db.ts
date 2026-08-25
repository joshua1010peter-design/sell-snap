import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    try {
      const { PrismaPg } = require('@prisma/adapter-pg')
      const { Pool } = require('pg')
      const pool = new Pool({ connectionString: dbUrl })
      const adapter = new PrismaPg(pool)
      return new PrismaClient({ adapter })
    } catch (e) {
      console.error('Failed to initialize Prisma with pg adapter:', e)
      throw e
    }
  }

  // SQLite local development (Prisma 7 requires driver adapter)
  try {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
    const adapter = new PrismaBetterSqlite3({ url: dbUrl || 'file:./dev.db' })
    return new PrismaClient({ adapter })
  } catch (e) {
    console.error('Failed to initialize Prisma with better-sqlite3 adapter:', e)
    throw e
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
