const { execSync } = require('child_process');
const path = require('path');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name.');
  console.error('Usage: pnpm migration:generate migration_name');
  process.exit(1);
}

const migrationPath = path.join(
  'apps/backend/src/database/migrations',
  migrationName
);

// Usar ts-node explícitamente para ejecutar el comando de TypeORM
const cmd = `pnpm ts-node --project ./apps/backend/tsconfig.json ./node_modules/typeorm/cli.js migration:generate "${migrationPath}" -d ./apps/backend/typeorm.config.ts`;

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  console.error('Error generating migration:', error.message);
  process.exit(1);
}
