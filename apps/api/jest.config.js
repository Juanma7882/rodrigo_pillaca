// Tests unitarios: archivos .spec.ts dentro de src.
module.exports = {
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['@swc/jest'] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  // El cliente generado por Prisma importa con extensión .js
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
