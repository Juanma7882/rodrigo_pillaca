import nest from '@tamila/config/eslint/nest';

export default [
  { ignores: ['dist/**', 'src/generated/**', '*.config.js', 'test/*.config.js'] },
  ...nest,
];
