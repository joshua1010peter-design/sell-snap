const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getDatabaseUrl() {
  // Priority: process.env (Vercel / shell export) > .env.local > .env
  const fileEnv = {};

  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
        if (match) {
          fileEnv[file] = match[1];
          break;
        }
      }
    }
  }

  // process.env always wins (set by Vercel, shell, CI, etc.)
  if (process.env.DATABASE_URL) {
    console.log(`[DB Setup] Using DATABASE_URL from process.env`);
    return process.env.DATABASE_URL;
  }

  // Fall back to .env.local, then .env (for local development)
  if (fileEnv['.env.local']) {
    console.log(`[DB Setup] Using DATABASE_URL from .env.local`);
    return fileEnv['.env.local'];
  }
  if (fileEnv['.env']) {
    console.log(`[DB Setup] Using DATABASE_URL from .env`);
    return fileEnv['.env'];
  }

  return '';
}

function setup() {
  const databaseUrl = getDatabaseUrl();
  const isVercelProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
  const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://') || (isVercelProd && !databaseUrl);
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

  console.log(`[DB Setup] Target provider: ${targetProvider}`);
  console.log(`[DB Setup] Database URL: ${databaseUrl ? '(set)' : '(not set)'}`);

  if (!databaseUrl) {
    if (isVercelProd) {
      console.warn('[DB Setup] WARNING: DATABASE_URL is not set in production build! Defaulting schema provider to postgresql.');
    } else {
      console.warn('[DB Setup] WARNING: DATABASE_URL is not set. Defaulting to SQLite.');
    }
  }

  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error(`[DB Setup] Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  let schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Find datasource db block and replace provider
  const datasourceRegex = /(datasource\s+db\s*\{\s*provider\s*=\s*")([^"]+)("\s*\})/g;
  const currentProviderMatch = datasourceRegex.exec(schemaContent);
  datasourceRegex.lastIndex = 0; // reset regex index

  if (currentProviderMatch) {
    const currentProvider = currentProviderMatch[2];
    if (currentProvider !== targetProvider) {
      console.log(`[DB Setup] Updating schema provider from "${currentProvider}" to "${targetProvider}"`);
      schemaContent = schemaContent.replace(datasourceRegex, `$1${targetProvider}$3`);
      fs.writeFileSync(schemaPath, schemaContent, 'utf-8');
    } else {
      console.log(`[DB Setup] Schema provider is already "${currentProvider}". No changes needed.`);
    }
  } else {
    console.warn('[DB Setup] Could not find datasource provider in schema.prisma. Skipping replacement.');
  }

  // Ensure public/uploads directory exists for image uploads
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('[DB Setup] Created public/uploads/ directory.');
  }

  // Run prisma generate
  console.log('[DB Setup] Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push schema to the database for both providers
  if (targetProvider === 'sqlite') {
    console.log('[DB Setup] Syncing SQLite database structure (prisma db push)...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
    } catch (e) {
      console.error('[DB Setup] Failed to push database schema:', e.message);
    }
  } else {
    console.log(`[DB Setup] Pushing schema to ${targetProvider} database (prisma db push)...`);
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    } catch (e) {
      console.warn(`[DB Setup] Warning: Failed to push schema to ${targetProvider} database:`, e.message);
      console.warn('[DB Setup] Ensure DATABASE_URL is correct and accessible.');
    }
  }
}

try {
  setup();
} catch (error) {
  console.error('[DB Setup] Error occurred:', error);
  process.exit(1);
}
