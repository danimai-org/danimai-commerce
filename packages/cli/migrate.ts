#!/usr/bin/env bun

import "reflect-metadata";
import { initialize, getService, DANIMAI_DB } from "@danimai/core";
import { getLogger } from "../../backend/logger";
import type { Kysely } from "kysely";

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: danimai migrate <package_name> <direction>");
  console.error("  package_name: The package name (e.g., 'product')");
  console.error("  direction: 'up' or 'down'");
  process.exit(1);
}

const [packageName, direction] = args;

if (direction !== "up" && direction !== "down") {
  console.error(`Invalid direction: ${direction}. Must be 'up' or 'down'`);
  process.exit(1);
}

// Validate package name format
if (!packageName.match(/^[a-z0-9-]+$/)) {
  console.error(`Invalid package name: ${packageName}`);
  process.exit(1);
}

async function runMigration() {
  try {
    const logger = getLogger();

    // Initialize the core system
    initialize({
      db: {
        url: process.env.DATABASE_URL || "",
      },
      logger,
      config: {
        stripeKey: process.env.STRIPE_KEY || "",
        defaultCurrency: process.env.DEFAULT_CURRENCY || "USD",
        email: {
          resendApiKey: process.env.RESEND_API_KEY || "",
          from: process.env.EMAIL_FROM || "",
          templateFolder: process.env.EMAIL_TEMPLATE_FOLDER || "",
        },
        jwt: {
          secret: process.env.JWT_SECRET || "",
        },
      },
    });

    // Get database connection
    const db = getService<Kysely<any>>(DANIMAI_DB);

    // Dynamically import the migration module
    // Try multiple import strategies
    const packagePath = `@danimai/${packageName}/db`;
    const relativePathFromCli = `../${packageName}/db/index.ts`;
    const relativePathFromRoot = `../../packages/${packageName}/db/index.ts`;

    logger.info(`Loading migration from package: ${packageName}...`);

    let migrationModule;
    let lastError: Error | null = null;

    // Try package path first (most reliable if packages are properly linked)
    try {
      migrationModule = await import(packagePath);
      logger.info(`Loaded migration from: ${packagePath}`);
    } catch (packageError: any) {
      lastError = packageError;
      // Try relative path from cli package location
      try {
        migrationModule = await import(relativePathFromCli);
        logger.info(`Loaded migration from: ${relativePathFromCli}`);
      } catch (relativeError: any) {
        lastError = relativeError;
        // Try relative path from project root
        try {
          migrationModule = await import(relativePathFromRoot);
          logger.info(`Loaded migration from: ${relativePathFromRoot}`);
        } catch (rootError: any) {
          logger.error(`Failed to load migration module`);
          logger.error(`Tried package path (${packagePath}): ${packageError.message}`);
          logger.error(`Tried relative from cli (${relativePathFromCli}): ${relativeError.message}`);
          logger.error(`Tried relative from root (${relativePathFromRoot}): ${rootError.message}`);
          process.exit(1);
        }
      }
    }

    // Check if the migration functions exist
    if (!migrationModule.up || !migrationModule.down) {
      logger.error(`Migration module does not export 'up' and 'down' functions`);
      process.exit(1);
    }

    // Run the migration
    logger.info(`Running migration ${direction} for package: ${packageName}`);

    if (direction === "up") {
      await migrationModule.up(db);
      logger.info("Migration 'up' completed successfully");
    } else {
      await migrationModule.down(db);
      logger.info("Migration 'down' completed successfully");
    }

    // Close database connection
    await db.destroy();

    logger.info("Migration completed");
    process.exit(0);
  } catch (error: any) {
    console.error("Migration failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
