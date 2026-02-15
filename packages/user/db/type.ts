import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export const PERMISSIONS = {
  // Product Permissions
  product: {
    create: "product:create",
    read: "product:read",
    update: "product:update",
    delete: "product:delete",
  },
  product_collection: {
    create: "product_collection:create",
    read: "product_collection:read",
    update: "product_collection:update",
    delete: "product_collection:delete",
  },
  product_tag: {
    create: "product_tag:create",
    read: "product_tag:read",
    update: "product_tag:update",
    delete: "product_tag:delete",
  },
  product_category: {
    create: "product_category:create",
    read: "product_category:read",
    update: "product_category:update",
    delete: "product_category:delete",
  },
  product_attribute: {
    create: "product_attribute:create",
    read: "product_attribute:read",
    update: "product_attribute:update",
    delete: "product_attribute:delete",
  },

  // Store Permissions
  store: {
    create: "store:create",
    read: "store:read",
    update: "store:update",
    delete: "store:delete",
  },
  region: {
    create: "region:create",
    read: "region:read",
    update: "region:update",
    delete: "region:delete",
  },
  order: {
    create: "order:create",
    read: "order:read",
    update: "order:update",
  },

  customer: {
    create: "customer:create",
    read: "customer:read",
    update: "customer:update",
    delete: "customer:delete",
  },
} as const;

export interface Database {
  users: UserTable;
  invites: InviteTable;
  permissions: PermissionTable;
  roles: RoleTable;
  role_permissions: RolePermissionTable;
  sessions: SessionTable;
}

export interface RoleTable {
  id: Generated<string>;
  name: string;
  description: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}

export type Role = Selectable<RoleTable>;
export type NewRole = Insertable<RoleTable>;
export type RoleUpdate = Updateable<RoleTable>;

export interface PermissionTable {
  id: Generated<string>;
  name: (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];
  description: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}

export type Permission = Selectable<PermissionTable>;
export type NewPermission = Insertable<PermissionTable>;
export type PermissionUpdate = Updateable<PermissionTable>;

export interface RolePermissionTable {
  id: Generated<string>;
  role_id: string;
  permission_id: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}

// table users
export interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
  role_id: string | null;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

// table invites
export interface InviteTable {
  id: Generated<string>;
  email: string;
  role: string | null; // e.g., "admin", "member", "developer"
  accepted: boolean;
  token: string;
  expires_at: string; // ISO timestamp
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Invite = Selectable<InviteTable>;
export type NewInvite = Insertable<InviteTable>;
export type InviteUpdate = Updateable<InviteTable>;

// table sessions — tracks each user session; filter by expires_at for automatic expiry
export interface SessionTable {
  id: Generated<string>;
  user_id: string;
  refresh_token_hash: string | null; // hash of refresh token for validation/revocation
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string; // ISO timestamp; session is invalid after this
  logged_out_at: string | null; // set when user logs out
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type Session = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type SessionUpdate = Updateable<SessionTable>;
