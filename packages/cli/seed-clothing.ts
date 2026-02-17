#!/usr/bin/env bun

/**
 * Seed clothing-shop data: categories (with hierarchy), collections, tags, and attributes.
 * Usage: danimai seed-clothing
 * Requires DATABASE_URL. Idempotent: skips existing handles/values where applicable.
 */

import "reflect-metadata";
import { initialize, getService, DANIMAI_DB, DANIMAI_LOGGER } from "@danimai/core";
import type { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_CATEGORIES_PROCESS,
  CREATE_COLLECTIONS_PROCESS,
  CREATE_PRODUCT_TAGS_PROCESS,
  CREATE_PRODUCT_ATTRIBUTES_PROCESS,
  type CreateProductCategoriesProcess,
  type CreateCollectionsProcess,
  type CreateProductTagsProcess,
  type CreateProductAttributesProcess,
} from "@danimai/product";
import { getLogger } from "../../backend/logger";

// Top-level then subcategories: { value, parentValue } parentValue null = top-level
const CATEGORIES: Array<{ value: string; parentValue: string | null }> = [
  { value: "Men", parentValue: null },
  { value: "Women", parentValue: null },
  { value: "Kids", parentValue: null },
  { value: "Accessories", parentValue: null },
  { value: "T-Shirts", parentValue: "Men" },
  { value: "Shirts", parentValue: "Men" },
  { value: "Pants", parentValue: "Men" },
  { value: "Shorts", parentValue: "Men" },
  { value: "Jackets & Coats", parentValue: "Men" },
  { value: "Tops", parentValue: "Women" },
  { value: "Dresses", parentValue: "Women" },
  { value: "Pants & Trousers", parentValue: "Women" },
  { value: "Skirts", parentValue: "Women" },
  { value: "Outerwear", parentValue: "Women" },
  { value: "Boys", parentValue: "Kids" },
  { value: "Girls", parentValue: "Kids" },
  { value: "Bags", parentValue: "Accessories" },
  { value: "Belts", parentValue: "Accessories" },
  { value: "Hats", parentValue: "Accessories" },
  { value: "Scarves", parentValue: "Accessories" },
];

const COLLECTIONS: Array<{ title: string; handle: string }> = [
  { title: "New Arrivals", handle: "new-arrivals" },
  { title: "Summer Collection", handle: "summer-collection" },
  { title: "Winter Collection", handle: "winter-collection" },
  { title: "Sale", handle: "sale" },
  { title: "Best Sellers", handle: "best-sellers" },
  { title: "Casual Wear", handle: "casual-wear" },
  { title: "Formal Wear", handle: "formal-wear" },
  { title: "Sustainable Edit", handle: "sustainable-edit" },
  { title: "Gift Guide", handle: "gift-guide" },
];

const TAGS: string[] = [
  "cotton",
  "polyester",
  "vintage",
  "casual",
  "formal",
  "summer",
  "winter",
  "sustainable",
  "organic",
  "slim-fit",
  "oversized",
  "linen",
  "denim",
  "new-arrival",
  "sale",
  "bestseller",
  "machine-washable",
  "handmade",
];

const ATTRIBUTES: Array<{ title: string; type: string }> = [
  { title: "Color", type: "string" },
  { title: "Size", type: "string" },
  { title: "Material", type: "string" },
  { title: "Fit", type: "string" },
  { title: "Length", type: "string" },
  { title: "Sleeve Length", type: "string" },
  { title: "Neckline", type: "string" },
  { title: "Pattern", type: "string" },
  { title: "Care Instructions", type: "string" },
  { title: "Season", type: "string" },
  { title: "Waist Size", type: "string" },
  { title: "Inseam", type: "string" },
  { title: "Collar Type", type: "string" },
  { title: "Closure Type", type: "string" },
  { title: "Stretch", type: "boolean" },
  { title: "Machine Washable", type: "boolean" },
  { title: "Weight (oz)", type: "number" },
  { title: "Release Date", type: "date" },
];

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

async function seedCategories(
  db: Kysely<any>,
  createCategoryProcess: CreateProductCategoriesProcess,
  processLogger: Logger
): Promise<Map<string, string>> {
  const byValue = new Map<string, string>();
  const created = await db
    .selectFrom("product_categories")
    .where("deleted_at", "is", null)
    .select(["id", "value"])
    .execute();
  for (const row of created) byValue.set(row.value, row.id);

  // Create top-level
  for (const { value, parentValue } of CATEGORIES) {
    if (parentValue !== null) continue;
    if (byValue.has(value)) continue;
    try {
      const cat = await createCategoryProcess.runOperations({
        input: { value, status: "active", visibility: "public" },
        logger: processLogger,
      });
      if (cat) byValue.set(value, cat.id);
    } catch (err: any) {
      console.error(`Category "${value}":`, err?.message ?? err);
    }
  }
  // Create children
  for (const { value, parentValue } of CATEGORIES) {
    if (parentValue === null) continue;
    if (byValue.has(value)) continue;
    const parentId = byValue.get(parentValue);
    if (!parentId) continue;
    try {
      const cat = await createCategoryProcess.runOperations({
        input: { value, parent_id: parentId, status: "active", visibility: "public" },
        logger: processLogger,
      });
      if (cat) byValue.set(value, cat.id);
    } catch (err: any) {
      console.error(`Category "${value}":`, err?.message ?? err);
    }
  }
  return byValue;
}

async function seedCollections(
  createCollectionProcess: CreateCollectionsProcess,
  processLogger: Logger
) {
  let n = 0;
  for (const { title, handle } of COLLECTIONS) {
    try {
      await createCollectionProcess.runOperations({
        input: { title, handle },
        logger: processLogger,
      });
      n++;
    } catch (err: any) {
      if (!String(err?.message ?? err).includes("already exists")) {
        console.error(`Collection "${title}":`, err?.message ?? err);
      }
    }
  }
  return n;
}

async function seedTags(
  db: Kysely<any>,
  createTagProcess: CreateProductTagsProcess,
  processLogger: Logger
) {
  const existing = new Set(
    (await db.selectFrom("product_tags").where("deleted_at", "is", null).select("value").execute()).map((r) => r.value)
  );
  let n = 0;
  for (const value of TAGS) {
    if (existing.has(value)) continue;
    try {
      await createTagProcess.runOperations({
        input: { value },
        logger: processLogger,
      });
      n++;
    } catch (err: any) {
      console.error(`Tag "${value}":`, err?.message ?? err);
    }
  }
  return n;
}

async function seedAttributes(
  db: Kysely<any>,
  createAttributeProcess: CreateProductAttributesProcess,
  processLogger: Logger
) {
  const existing = new Set(
    (await db.selectFrom("product_attributes").where("deleted_at", "is", null).select("title").execute()).map((r) => r.title)
  );
  let n = 0;
  for (const { title, type } of ATTRIBUTES) {
    if (existing.has(title)) continue;
    try {
      await createAttributeProcess.runOperations({
        input: { title, type },
        logger: processLogger,
      });
      n++;
    } catch (err: any) {
      console.error(`Attribute "${title}":`, err?.message ?? err);
    }
  }
  return n;
}

async function runSeedClothing() {
  const logger = getLogger();

  try {
    initialize(getInitConfig());
    const db = getService<Kysely<any>>(DANIMAI_DB);
    const processLogger = getService<Logger>(DANIMAI_LOGGER);
    const createCategoryProcess = getService<CreateProductCategoriesProcess>(CREATE_PRODUCT_CATEGORIES_PROCESS);
    const createCollectionProcess = getService<CreateCollectionsProcess>(CREATE_COLLECTIONS_PROCESS);
    const createTagProcess = getService<CreateProductTagsProcess>(CREATE_PRODUCT_TAGS_PROCESS);
    const createAttributeProcess = getService<CreateProductAttributesProcess>(CREATE_PRODUCT_ATTRIBUTES_PROCESS);

    console.log("Seeding clothing-shop data...\n");

    const categoryMap = await seedCategories(db, createCategoryProcess, processLogger);
    console.log(`Categories: ${categoryMap.size} total (created or existing)`);

    const collectionsCreated = await seedCollections(createCollectionProcess, processLogger);
    console.log(`Collections: ${collectionsCreated} created`);

    const tagsCreated = await seedTags(db, createTagProcess, processLogger);
    console.log(`Tags: ${tagsCreated} created`);

    const attributesCreated = await seedAttributes(db, createAttributeProcess, processLogger);
    console.log(`Attributes: ${attributesCreated} created`);

    console.log("\nClothing seed finished.");
    await db.destroy();
    process.exit(0);
  } catch (err: any) {
    console.error("Seed failed:", err?.message ?? err);
    process.exit(1);
  }
}

runSeedClothing();
