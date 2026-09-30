import reactConfig from '@tamila/config/eslint/react';

export default [
  { ignores: ['dist/**'] },
  ...reactConfig({ root: 'src', aliases: { '@/': 'src/' } }),
];
