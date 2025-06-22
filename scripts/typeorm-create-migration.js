const { execSync } = require('child_process');
const path = require('path');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name.');
  console.error('Usage: pnpm migration:create migration_name');
  process.exit(1);
}

const migrationPath = path.join(
  'apps/backend/src/database/migrations',
  migrationName
);

const cmd = `pnpm typeorm migration:create "${migrationPath}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  console.error('Error creating migration:', error.message);
  process.exit(1);
}
