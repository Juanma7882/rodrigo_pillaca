import globals from 'globals';
import base from '@tamila/config/eslint/base';

// Solo archivos sueltos de la raíz: cada app/paquete tiene su propio eslint.config.js.
export default [
  { ignores: ['apps/**', 'packages/**', 'e2e/**', 'openspec/**', '.claude/**'] },
  ...base,
  { languageOptions: { globals: globals.node } },
];
