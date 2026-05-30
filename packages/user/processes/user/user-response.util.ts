import type { Static } from "@sinclair/typebox";
import type { MeResponseSchema } from "./retrieve-user/retrieve-user.schema";

type UserRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  metadata: unknown;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  role_id: string | null;
  password_hash?: string | null;
};

function coerceDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toUserApiRow(row: UserRow): Static<typeof MeResponseSchema> {
  const { password_hash: _passwordHash, ...user } = row;
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    metadata: user.metadata,
    role_id: user.role_id,
    created_at: coerceDate(user.created_at),
    updated_at: coerceDate(user.updated_at),
    deleted_at: user.deleted_at == null ? null : coerceDate(user.deleted_at),
  };
}
