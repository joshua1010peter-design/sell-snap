const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getDatabaseUrl() {
  let databaseUrl = process.env.DATABASE_URL;

  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
        if (match) {
          databaseUrl = match[1];
          break;
        }
      }
    }
    if (databaseUrl) break;
  }

  return databaseUrl || '';
}

function setup() {
  const databaseUrl = getDatabaseUrl();
  const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

  console.log(`[DB Setup] Detected database URL: ${databaseUrl ? '(hidden)' : 'none'}`);
  console.log(`[DB Setup] Target provider: ${targetProvider}`);

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

  // If using SQLite, run db push to ensure tables are created
  if (targetProvider === 'sqlite') {
    console.log('[DB Setup] Syncing SQLite database structure (prisma db push)...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
    } catch (e) {
      console.error('[DB Setup] Failed to push database schema:', e.message);
    }
  }
}

try {
  setup();
} catch (error) {
  console.error('[DB Setup] Error occurred:', error);
  process.exit(1);
}
