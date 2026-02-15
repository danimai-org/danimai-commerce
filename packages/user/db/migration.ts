import { Kysely, sql } from "kysely";
import type { RoleTable } from "./type";

const DEFAULT_PERMISSIONS = [
  "product:create",
  "product:read",
  "product:update",
  "product:delete",
  "product_collection:create",
  "product_collection:read",
  "product_collection:update",
  "product_collection:delete",
  "product_tag:create",
  "product_tag:read",
  "product_tag:update",
  "product_tag:delete",
  "product_category:create",
  "product_category:read",
  "product_category:update",
  "product_category:delete",
  "product_attribute:create",
  "product_attribute:read",
  "product_attribute:update",
  "product_attribute:delete",
  "store:create",
  "store:read",
  "store:update",
  "store:delete",
  "region:create",
  "region:read",
  "region:update",
  "region:delete",
  "order:create",
  "order:read",
  "order:update",
  "customer:create",
  "customer:read",
  "customer:update",
  "customer:delete",
] as RoleTable['name'][];

export async function up(db: Kysely<any>) {
  // Roles
  await db.schema
    .createTable("roles")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull().unique())
    .addColumn("description", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Permissions
  await db.schema
    .createTable("permissions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull().unique())
    .addColumn("description", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Role-Permissions (junction)
  await db.schema
    .createTable("role_permissions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("role_id", "uuid", (col) =>
      col.notNull().references("roles.id").onDelete("cascade")
    )
    .addColumn("permission_id", "uuid", (col) =>
      col.notNull().references("permissions.id").onDelete("cascade")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  await db.schema
    .createIndex("role_permissions_role_id_index")
    .on("role_permissions")
    .column("role_id")
    .execute();
  await db.schema
    .createIndex("role_permissions_permission_id_index")
    .on("role_permissions")
    .column("permission_id")
    .execute();

  // Users
  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("password_hash", "text")
    .addColumn("first_name", "text")
    .addColumn("last_name", "text")
    .addColumn("avatar_url", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("role_id", "uuid", (col) => col.references("roles.id"))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Invites
  await db.schema
    .createTable("invites")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("role", "text") // e.g., "admin", "member", "developer"
    .addColumn("accepted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("token", "text", (col) => col.notNull().unique())
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Sessions — one row per login session; expires_at used to treat as expired automatically
  await db.schema
    .createTable("sessions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("users.id").onDelete("cascade")
    )
    .addColumn("refresh_token_hash", "text")
    .addColumn("ip_address", "text")
    .addColumn("user_agent", "text")
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("logged_out_at", "timestamptz")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createIndex("sessions_user_id_expires_at_index")
    .on("sessions")
    .columns(["user_id", "expires_at"])
    .execute();
  await db.schema
    .createIndex("sessions_expires_at_index")
    .on("sessions")
    .column("expires_at")
    .execute();

  // Seed default permissions
  for (const name of DEFAULT_PERMISSIONS) {
    await db
      .insertInto("permissions")
      .values({
        name,
        description: `Permission: ${name}`,
      })
      .execute();
  }
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("sessions").execute();
  await db.schema.dropTable("invites").execute();
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("role_permissions").execute();
  await db.schema.dropTable("permissions").execute();
  await db.schema.dropTable("roles").execute();
}
