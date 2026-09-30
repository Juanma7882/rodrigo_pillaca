/** Tests e2e de la API contra un PostgreSQL real (base de datos de pruebas). */
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': ['@swc/jest'] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  // El cliente generado por Prisma importa con extensión .js
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
};
