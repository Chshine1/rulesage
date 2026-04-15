import { sync } from 'glob';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

import { customPlugin } from './eslint-rules/index.mjs';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// noinspection JSCheckFunctionSignatures
export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist', 'node_modules'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      import: importPlugin,
      custom: customPlugin,
    },
    rules: {
      'custom/no-directory-import': 'error',
      
      'import/no-extraneous-dependencies': [
        'error',
        {
          packageDir: [
            ...sync('packages/*/', { cwd: __dirname, absolute: true }),
          ],
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        {
          packageDir: [
            __dirname,
            ...sync('packages/*/', { cwd: __dirname, absolute: true }),
          ],
          devDependencies: true,
        },
      ],
    },
  },
  {
    files: ['libs/typed-client/src/patterns/*.patterns.ts'],
    rules: {
      '@typescript-eslint/no-invalid-void-type': 'off',
    },
  },
);