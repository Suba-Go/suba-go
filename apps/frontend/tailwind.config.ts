const { join } = require('path');
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');

// Import the root Tailwind config
const rootTailwindConfig = require('../../tailwind.config.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Extend the root configuration
  presets: [rootTailwindConfig],

  // Define content paths for this specific app
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{js,ts,jsx,tsx,mdx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],

  // Extend the theme with additional configurations
  theme: {
    extend: {},
  },
};
