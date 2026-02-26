#!/usr/bin/env bun

import "reflect-metadata";
import { initialize, getService, DANIMAI_DB, DANIMAI_LOGGER, DANIMAI_PASSWORD } from "@danimai/core";
import type { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_ROLE_PROCESS,
  CreateRoleProcess,
} from "@danimai/user";
import { getLogger } from "../../backend/logger";

const SUPERADMIN_ROLE_NAME = "SuperAdmin";

function getInitConfig() {
  const logger = getLogger();
  return {
    db: { url: process.env.DATABASE_URL || "" },
    logger,
    config: {
      stripeKey: process.env.STRIPE_KEY || "",
      defaultCurrency: process.env.DEFAULT_CURRENCY || "USD",
      email: {
        resendApiKey: process.env.RESEND_API_KEY || "",
        from: process.env.EMAIL_FROM || "",
        templateFolder: process.env.EMAIL_TEMPLATE_FOLDER || "",
      },
      jwt: { secret: process.env.JWT_SECRET || "" },
    },
  };
}

async function runCreateSuperadmin() {
  const args = process.argv.slice(2);
  const email = args[0] ?? process.env.SUPERADMIN_EMAIL;
  const password = args[1] ?? process.env.SUPERADMIN_PASSWORD;

  if (!email?.trim()) {
    console.error("Usage: danimai create-superadmin <email> [password]");
    console.error("  Or set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables.");
    process.exit(1);
  }

  if (!password?.trim()) {
    console.error("Password is required (argument or SUPERADMIN_PASSWORD env).");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const logger = getLogger();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    initialize(getInitConfig());

    const db = getService<Kysely<any>>(DANIMAI_DB);
    const passwordService = getService<{ hash: (password: string) => Promise<string> }>(DANIMAI_PASSWORD);
    const createRoleProcess = getService<CreateRoleProcess>(CREATE_ROLE_PROCESS);

    // Find or create SuperAdmin role
    let role = await db
      .withSchema("public")
      .selectFrom("roles")
      .where("name", "=", SUPERADMIN_ROLE_NAME)
      .where("deleted_at", "is", null)
      .select(["id"])
      .executeTakeFirst();

    if (!role) {
      const newRole = await createRoleProcess.runOperations({
        input: { name: SUPERADMIN_ROLE_NAME, description: "Super administrator with full access" },
        logger: getService<Logger>(DANIMAI_LOGGER),
      });
      role = newRole ? { id: newRole.id } : null;
    }

    if (!role) {
      console.error("Failed to resolve SuperAdmin role.");
      process.exit(1);
    }

    const existingUser = await db
      .withSchema("public")
      .selectFrom("users")
      .where("email", "=", normalizedEmail)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existingUser) {
      console.error(`A user with email "${normalizedEmail}" already exists.`);
      process.exit(1);
    }

    const passwordHash = await passwordService.hash(password.trim());
    await db
      .withSchema("public")
      .insertInto("users")
      .values({
        email: normalizedEmail,
        password_hash: passwordHash,
        role_id: role.id,
      })
      .execute();

    logger.info(`SuperAdmin created: ${normalizedEmail}`);
    console.log(`SuperAdmin created successfully: ${normalizedEmail}`);
    await db.destroy();
    process.exit(0);
  } catch (err: any) {
    console.error("Failed to create superadmin:", err?.message ?? err);
    process.exit(1);
  }
}

runCreateSuperadmin();
