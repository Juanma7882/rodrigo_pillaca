import { Prisma } from '../generated/prisma/client';
import { fieldError } from './http-errors';

/** Tablas con columna "order". Lista cerrada: el nombre se interpola en el SQL. */
export type OrderedTable = 'services' | 'projects' | 'process_steps' | 'faqs';

type RawClient = Pick<Prisma.TransactionClient, '$executeRaw' | '$queryRaw'>;

/** La lista enviada tiene que tener exactamente los ids existentes, sin repetidos. */
export function assertSameIds(existing: string[], ids: string[]): void {
  const sent = new Set(ids);
  const complete =
    sent.size === ids.length &&
    ids.length === existing.length &&
    existing.every((id) => sent.has(id));
  if (!complete) {
    throw fieldError(
      'ids',
      'La lista tiene que incluir todos los elementos, una sola vez cada uno',
    );
  }
}

/** Siguiente posición libre (al final). */
export async function nextOrder(tx: RawClient, table: OrderedTable): Promise<number> {
  const [row] = await tx.$queryRaw<[{ next: number }]>`
    SELECT COALESCE(MAX("order"), 0)::int + 1 AS next FROM ${Prisma.raw(`"${table}"`)}`;
  return row.next;
}

/**
 * Aplica el orden 1..n según la lista de ids. En dos pasadas (primero a negativos) para no
 * violar los índices únicos de "order" mientras se intercambian posiciones.
 */
export async function applyOrder(tx: RawClient, table: OrderedTable, ids: string[]): Promise<void> {
  const rows = Prisma.join(ids.map((id, index) => Prisma.sql`(${id}::text, ${index + 1}::int)`));
  await tx.$executeRaw`
    UPDATE ${Prisma.raw(`"${table}"`)} AS t SET "order" = -v.pos
    FROM (VALUES ${rows}) AS v(id, pos) WHERE t.id = v.id`;
  await flipNegative(tx, table);
}

/** Renumera 1..n respetando el orden actual (después de borrar, no quedan huecos). */
export async function renumber(tx: RawClient, table: OrderedTable): Promise<void> {
  const name = Prisma.raw(`"${table}"`);
  await tx.$executeRaw`
    UPDATE ${name} AS t SET "order" = -s.pos
    FROM (SELECT id, row_number() OVER (ORDER BY "order") AS pos FROM ${name}) AS s
    WHERE t.id = s.id`;
  await flipNegative(tx, table);
}

function flipNegative(tx: RawClient, table: OrderedTable) {
  return tx.$executeRaw`
    UPDATE ${Prisma.raw(`"${table}"`)} SET "order" = -"order" WHERE "order" < 0`;
}
