#!/usr/bin/env bun

/**
 * Seed the database with 10K sample products, categories, and tags.
 * Usage: danimai seed-products [count]
 * Default count: 10000. Requires DATABASE_URL and product + pricing migrations.
 */

import "reflect-metadata";
import { randomUUID } from "crypto";
import { initialize, getService, DANIMAI_DB, DANIMAI_LOGGER } from "@danimai/core";
import type { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCTS_PROCESS,
  type CreateProductsProcess,
} from "@danimai/product";
import { getLogger } from "../../backend/logger";

const DEFAULT_COUNT = 10_000;
const BATCH_SIZE = 100;

const SAMPLE_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Health & Beauty",
  "Automotive",
  "Office Supplies",
  "Pet Supplies",
  "Jewelry",
  "Food & Beverage",
  "Baby & Kids",
  "Tools & Hardware",
  "Arts & Crafts",
  "Garden",
  "Furniture",
  "Kitchen",
  "Outdoor",
  "Fitness",
];

const SAMPLE_TAGS = [
  "sale",
  "new-arrival",
  "bestseller",
  "premium",
  "organic",
  "eco-friendly",
  "limited-edition",
  "handmade",
  "vintage",
  "trending",
  "clearance",
  "gift-idea",
  "summer",
  "winter",
  "black-friday",
  "featured",
  "staff-pick",
  "customer-favorite",
  "exclusive",
  "imported",
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "item";
}

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

async function seedCategories(db: Kysely<any>): Promise<string[]> {
  const ids: string[] = [];
  for (const value of SAMPLE_CATEGORIES) {
    const id = randomUUID();
    const handle = slug(value) || "category";
    await db
      .insertInto("product_categories")
      .values({
        id,
        value,
        handle,
        metadata: null,
        parent_id: null,
        status: "active",
        visibility: "public",
        deleted_at: null,
      })
      .execute();
    ids.push(id);
  }
  return ids;
}

async function ensureCategoriesAndTags(
  db: Kysely<any>
): Promise<{ categoryIds: string[]; tagIds: string[] }> {
  let categoryIds = await db
    .selectFrom("product_categories")
    .where("deleted_at", "is", null)
    .select("id")
    .execute();
  if (categoryIds.length === 0) {
    await seedCategories(db);
    categoryIds = await db
      .selectFrom("product_categories")
      .where("deleted_at", "is", null)
      .select("id")
      .execute();
  }

  let tagIds = await db
    .selectFrom("product_tags")
    .where("deleted_at", "is", null)
    .select("id")
    .execute();
  if (tagIds.length === 0) {
    for (const value of SAMPLE_TAGS) {
      await db
        .insertInto("product_tags")
        .values({
          id: randomUUID(),
          value,
          metadata: null,
          deleted_at: null,
        })
        .execute();
    }
    tagIds = await db
      .selectFrom("product_tags")
      .where("deleted_at", "is", null)
      .select("id")
      .execute();
  }

  return {
    categoryIds: categoryIds.map((r) => r.id),
    tagIds: tagIds.map((r) => r.id),
  };
}

function buildProductBatch(
  offset: number,
  count: number,
  categoryIds: string[]
): Array<{
  title: string;
  subtitle?: string;
  description?: string;
  status: "published";
  category_id: string;
  options: Array<{ title: string; values: string[] }>;
  variants: Array<{
    title: string;
    sku: string;
    options: Record<string, string>;
    prices: Array<{ amount: number; currency_code: string }>;
  }>;
}> {
  const products: Array<{
    title: string;
    subtitle?: string;
    description?: string;
    status: "published";
    category_id: string;
    options: Array<{ title: string; values: string[] }>;
    variants: Array<{
      title: string;
      sku: string;
      options: Record<string, string>;
      prices: Array<{ amount: number; currency_code: string }>;
    }>;
  }> = [];
  const sizes = ["S", "M", "L", "XL"];
  const colors = ["Black", "White", "Gray", "Navy", "Red"];

  for (let i = 0; i < count; i++) {
    const n = offset + i + 1;
    const hasSize = n % 3 !== 0;
    const optionTitle = hasSize ? "Size" : "Color";
    const optionValues = hasSize ? sizes : colors;
    const categoryId = categoryIds[n % categoryIds.length]!;
    products.push({
      title: `Sample Product ${n}`,
      subtitle: `Subtitle for product ${n}`,
      description: `Description for product ${n}. High quality and great value. Perfect for everyday use.`,
      status: "published",
      category_id: categoryId,
      options: [{ title: optionTitle, values: optionValues }],
      variants: optionValues.map((v, vi) => ({
        title: v,
        sku: `SKU-${n}-${vi + 1}`,
        options: { [optionTitle]: v },
        prices: [{ amount: 999 + (n % 5000), currency_code: "USD" }],
      })),
    });
  }
  return products;
}

async function runSeedProducts() {
  const args = process.argv.slice(2);
  const count = Math.min(
    Math.max(1, parseInt(args[0] ?? String(DEFAULT_COUNT), 10) || DEFAULT_COUNT),
    100_000
  );

  const logger = getLogger();
  logger.info(`Starting seed: ${count} products (batch size ${BATCH_SIZE})`);

  try {
    initialize(getInitConfig());
    const db = getService<Kysely<any>>(DANIMAI_DB);
    const createProductsProcess = getService<CreateProductsProcess>(
      CREATE_PRODUCTS_PROCESS
    );
    const logService = getService<Logger>(DANIMAI_LOGGER);

    const { categoryIds, tagIds } = await ensureCategoriesAndTags(db);
    logger.info(`Using ${categoryIds.length} categories, ${tagIds.length} tags`);

    let created = 0;
    for (let offset = 0; offset < count; offset += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, count - offset);
      const products = buildProductBatch(offset, batchCount, categoryIds);
      const result = await createProductsProcess.runOperations({
        input: { products },
        logger: logService,
      });
      const productIds = result.map((p) => p.id);

      for (const productId of productIds) {
        const numTags = 1 + (Math.floor(Math.random() * 4));
        const shuffled = [...tagIds].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, numTags);
        for (const tagId of selected) {
          try {
            await db
              .insertInto("product_tag_relations")
              .values({ product_id: productId, product_tag_id: tagId })
              .execute();
          } catch {
            // ignore duplicate
          }
        }
      }

      created += result.length;
      logger.info(`Created products ${offset + 1}-${offset + result.length} of ${count}`);
    }

    logger.info(`Seed complete: ${created} products created.`);
    console.log(`Seed complete: ${created} products with categories and tags.`);
    await db.destroy();
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Seed failed:", msg);
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runSeedProducts();
