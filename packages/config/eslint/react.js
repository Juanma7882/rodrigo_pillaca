import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import base from './base.js';
import boundaries from './feature-boundaries.js';

/**
 * @param {{ root?: string, aliases?: Record<string, string> }} [options]
 *   root: carpeta que contiene `features/` (src en SPA, app en React Router framework).
 */
export default function reactConfig(options = {}) {
  return tseslint.config(...base, {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      tamila: boundaries,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'tamila/feature-boundaries': ['error', options],
    },
  });
}
