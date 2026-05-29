import { sql, type RawBuilder } from "kysely";

function normalizeJsonValue(value: unknown): unknown | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "object") {
    try {
      return JSON.parse(JSON.stringify(value)) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Returns a JSON text payload for Postgres json/jsonb columns.
 */
export function toJsonb(value: unknown): string | null {
  const normalized = normalizeJsonValue(value);
  if (normalized === null) return null;
  return JSON.stringify(normalized);
}

/**
 * Kysely expression with an explicit jsonb cast for inserts/updates.
 */
export function jsonb(value: unknown): RawBuilder<unknown> | null {
  const text = toJsonb(value);
  if (text === null) return null;
  return sql`${text}::jsonb`;
}

/**
 * Returns cart/order metadata as a plain object for merging.
 */
export function metadataRecord(value: unknown): Record<string, unknown> {
  const parsed = normalizeJsonValue(value);
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return {};
}
