import type { Generated, Selectable, Insertable, Updateable } from "kysely";

/**
 * API Key module data types based on Danimai API Key Module.
 */

type ApiKeyType = "publishable" | "secret";

export interface Database {
  api_keys: ApiKeyTable;
}

// table api_keys
export interface ApiKeyTable {
  id: Generated<string>;
  type: ApiKeyType;
  title: string | null;
  token: string | null; // hashed token
  revoked_at: string | null; // ISO timestamp when revoked
  revoked_by: string | null; // user id who revoked
  created_by: string | null; // user id who created
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ApiKey = Selectable<ApiKeyTable>;
export type NewApiKey = Insertable<ApiKeyTable>;
export type ApiKeyUpdate = Updateable<ApiKeyTable>;
