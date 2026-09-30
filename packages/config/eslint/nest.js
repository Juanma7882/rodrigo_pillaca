import globals from 'globals';
import tseslint from 'typescript-eslint';
import base from './base.js';

export default tseslint.config(...base, {
  languageOptions: { globals: { ...globals.node, ...globals.jest } },
  rules: {
    // Nest usa clases inyectadas por tipo: los imports de tipos deben ser valores.
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
  },
});
