import reactConfig from '@tamila/config/eslint/react';

export default [
  { ignores: ['build/**', '.react-router/**'] },
  ...reactConfig({ root: 'app', aliases: { '~/': 'app/' } }),
  {
    // Los módulos de ruta de React Router exportan loader/meta/ErrorBoundary junto al componente.
    files: ['app/root.tsx', 'app/routes/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
