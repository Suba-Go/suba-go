import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import { fixupConfigRules } from '@eslint/compat';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  tseslint.configs.base,
  ...fixupConfigRules(compat.extends('next')),
  // ...fixupConfigRules(compat.extends('next/core-web-vitals')),
  // ...fixupConfigRules(compat.extends('plugin:react-hooks/recommended')),
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  {
    ignores: ['.next/**/*'],
  },
];
