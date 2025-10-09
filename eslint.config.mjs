import nx from '@nx/eslint-plugin';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/node_modules/',
      'dist/*',
      '**/.next/',
      '**/.nx/',
      'libs/shared-components/src/components/ui/**/*',
    ],
  },
  {
    plugins: {
      '@nx': nx,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],

    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],

          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },

  //{
  //files: ['apps/backend/src/modules/**/*.controller.ts'],
  //plugins: { customRules },
  //rules: { 'customRules/useguards': 'error' },
  //},

  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {},
  },

  ...compat.extends('plugin:@nx/javascript').map((config) => ({
    ...config,
    files: ['**/*.js', '**/*.jsx'],
  })),
  ...compat.extends('plugin:@nx/typescript').map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  //{
  //files: ['libs/shared-validation/src/lib/schemas/**/*.ts'],
  //rules: {
  //'no-useless-escape': 'off',
  //},
  //},
];
