import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * ESLint 9 (flat) + TypeScript + React + react-hooks.
 *
 * - Erreurs bloquantes : principalement `react-hooks/rules-of-hooks` (hooks mal utilisés).
 * - Le reste est volontairement peu bruyant sur cette base historique.
 * - `tsc --noEmit` reste la source de vérité pour les noms non résolus (ex. hook oublié à l’import).
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'cypress/**',
      '*.config.js',
      '*.config.ts',
      'coverage/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // Hooks : garder strict sur l’ordre / le contexte d’appel (évite plantages runtime).
      'react-hooks/rules-of-hooks': 'error',
      // Très verbeux sur une grosse app ; les revoir au cas par cas.
      'react-hooks/exhaustive-deps': 'off',

      // Base existante : ne pas bloquer la CI sur le bruit.
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off',

      // Préférence douce (warning) — n’échoue pas avec --max-warnings 0 si aucun cas.
      'prefer-const': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  }
);
