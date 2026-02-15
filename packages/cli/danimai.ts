#!/usr/bin/env bun

/**
 * Danimai CLI
 *
 * Usage:
 *   danimai migrate <package_name> <direction>
 *   danimai create-superadmin <email> [password]
 *   danimai seed-products [count]
 *
 * Examples:
 *   danimai migrate user up
 *   danimai create-superadmin admin@example.com mypassword
 *   danimai seed-products 10000
 */

import "reflect-metadata";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";

const command = process.argv[2];

if (!command) {
  console.error("Usage: danimai <command> [options]");
  console.error("\nCommands:");
  console.error("  migrate <package_name> <direction>  Run database migrations");
  console.error("  create-superadmin <email> [password]  Create a SuperAdmin user");
  console.error("  seed-products [count]  Seed sample products (default 10000) with categories and tags");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (command === "migrate") {
  const migrateScript = join(__dirname, "migrate.ts");
  const args = process.argv.slice(3);
  const proc = spawn("bun", [migrateScript, ...args], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  proc.on("exit", (code) => process.exit(code ?? 0));
  proc.on("error", (err) => {
    console.error("Failed to spawn migration script:", err);
    process.exit(1);
  });
} else if (command === "create-superadmin") {
  const createSuperadminScript = join(__dirname, "create-superadmin.ts");
  const args = process.argv.slice(3);
  const proc = spawn("bun", [createSuperadminScript, ...args], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  proc.on("exit", (code) => process.exit(code ?? 0));
  proc.on("error", (err) => {
    console.error("Failed to spawn create-superadmin script:", err);
    process.exit(1);
  });
} else if (command === "seed-products") {
  const seedProductsScript = join(__dirname, "seed-products.ts");
  const args = process.argv.slice(3);
  const proc = spawn("bun", [seedProductsScript, ...args], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  proc.on("exit", (code) => process.exit(code ?? 0));
  proc.on("error", (err) => {
    console.error("Failed to spawn seed-products script:", err);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Run 'danimai' without arguments to see available commands");
  process.exit(1);
}
