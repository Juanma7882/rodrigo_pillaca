import globals from 'globals';
import base from '@tamila/config/eslint/base';

export default [
  { ignores: ['playwright-report/**', 'test-results/**'] },
  ...base,
  { languageOptions: { globals: globals.node } },
];
