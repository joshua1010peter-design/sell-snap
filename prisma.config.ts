import { defineConfig } from '@prisma/config'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

// Detect the provider from schema.prisma
const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma')
let provider = 'sqlite'
try {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
  // Find the provider in datasource db block
  const dbBlock = schemaContent.match(/datasource\s+db\s*\{([^}]+)\}/)
  if (dbBlock && dbBlock[1]) {
    const providerMatch = dbBlock[1].match(/provider\s*=\s*"([^"]+)"/)
    if (providerMatch && providerMatch[1]) {
      provider = providerMatch[1]
    }
  }
} catch (e) {
  // Ignore
}

const dbUrl = provider === 'sqlite' 
  ? 'file:./dev.db' 
  : (process.env.DATABASE_URL || '')

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
})
