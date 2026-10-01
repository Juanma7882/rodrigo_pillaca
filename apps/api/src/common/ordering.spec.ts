import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { applyOrder, assertSameIds, renumber } from './ordering';

/** Cliente falso que registra el SQL (con los parámetros) de cada sentencia. */
function fakeClient() {
  const statements: { sql: string; values: unknown[] }[] = [];
  const record = (sql: { sql: string; values: unknown[] }) => {
    statements.push({ sql: sql.sql.replace(/\s+/g, ' ').trim(), values: sql.values });
    return Promise.resolve(1);
  };
  const tx = {
    $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) =>
      // Prisma.sql arma el mismo objeto que recibe $executeRaw.
      record(Prisma.sql(strings, ...values)),
    $queryRaw: () => Promise.resolve([{ next: 1 }]),
  };
  return { tx: tx as never, statements };
}

describe('assertSameIds', () => {
  const existing = ['a', 'b', 'c'];

  it('acepta los mismos ids en otro orden', () => {
    expect(() => assertSameIds(existing, ['c', 'a', 'b'])).not.toThrow();
  });

  it.each([
    ['incompleta', ['a', 'b']],
    ['con repetidos', ['a', 'a', 'b']],
    ['con un id ajeno', ['a', 'b', 'z']],
    ['con un id de más', ['a', 'b', 'c', 'z']],
  ])('rechaza una lista %s con 400 en el campo ids', (_name, ids) => {
    try {
      assertSameIds(existing, ids);
      throw new Error('no lanzó');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const body = (error as BadRequestException).getResponse() as { errors: { field: string }[] };
      expect(body.errors[0]?.field).toBe('ids');
    }
  });
});

describe('applyOrder y renumber', () => {
  it('pasa primero por valores negativos y después los invierte (no viola el índice único)', async () => {
    const { tx, statements } = fakeClient();
    await applyOrder(tx, 'faqs', ['x', 'y']);

    expect(statements).toHaveLength(2);
    expect(statements[0]?.sql).toContain('UPDATE "faqs" AS t SET "order" = -v.pos');
    expect(statements[0]?.values).toEqual(['x', 1, 'y', 2]);
    expect(statements[1]?.sql).toBe('UPDATE "faqs" SET "order" = -"order" WHERE "order" < 0');
  });

  it('renumber usa row_number sobre el orden actual', async () => {
    const { tx, statements } = fakeClient();
    await renumber(tx, 'process_steps');
    expect(statements[0]?.sql).toContain('row_number() OVER (ORDER BY "order")');
    expect(statements[1]?.sql).toContain('UPDATE "process_steps" SET "order" = -"order"');
  });
});
