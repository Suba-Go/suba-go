// Load environment variables
require('dotenv').config({ path: './apps/backend/.env' });

// Register module aliases
require('./dist/apps/backend/apps/backend/src/register-aliases.js');

// Start the application
require('./dist/apps/backend/apps/backend/src/main.js');
