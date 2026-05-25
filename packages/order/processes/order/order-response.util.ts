import { sql, type Kysely } from "kysely";
import type { Database, Order } from "../../db/type";

let ordersCartIdColumnCache: boolean | null = null;

export async function hasOrdersCartIdColumn(db: Kysely<Database>): Promise<boolean> {
  if (ordersCartIdColumnCache !== null) return ordersCartIdColumnCache;
  const row = await sql<{ exists: boolean }>`
    select exists (
      select 1
      from information_schema.columns
      where table_name = 'orders'
        and column_name = 'cart_id'
    ) as exists
  `.execute(db);
  ordersCartIdColumnCache = Boolean(row.rows[0]?.exists);
  return ordersCartIdColumnCache;
}

function coerceDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toOrderApiRow(
  row: Order & { cart_id?: string | null },
  hasCartIdColumn: boolean
): Order {
  return {
    ...row,
    cart_id: hasCartIdColumn ? (row.cart_id ?? null) : null,
    created_at: coerceDate(row.created_at),
    updated_at: coerceDate(row.updated_at),
    deleted_at:
      row.deleted_at == null ? null : coerceDate(row.deleted_at as Date | string),
  };
}
