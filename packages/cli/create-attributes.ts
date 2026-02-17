#!/usr/bin/env bun

import "reflect-metadata";
import { initialize, getService, DANIMAI_DB, DANIMAI_LOGGER } from "@danimai/core";
import type { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_ATTRIBUTES_PROCESS,
  CreateProductAttributesProcess,
} from "@danimai/product";
import { getLogger } from "../../backend/logger";

/** Real clothing-shop attributes: title and type */
const CLOTHING_ATTRIBUTES: Array<{ title: string; type: string }> = [
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

async function runCreateAttributes() {
  const logger = getLogger();

  try {
    initialize(getInitConfig());

    const db = getService<Kysely<any>>(DANIMAI_DB);
    const createAttributeProcess = getService<CreateProductAttributesProcess>(
      CREATE_PRODUCT_ATTRIBUTES_PROCESS
    );
    const processLogger = getService<Logger>(DANIMAI_LOGGER);

    console.log(`Creating ${CLOTHING_ATTRIBUTES.length} clothing attributes...`);

    let created = 0;
    for (const { title, type } of CLOTHING_ATTRIBUTES) {
      try {
        await createAttributeProcess.runOperations({
          input: { title, type },
          logger: processLogger,
        });
        created++;
      } catch (err: any) {
        logger.error(`Failed to create attribute "${title}":`, err);
        console.error(`Failed to create attribute "${title}":`, err?.message ?? err);
      }
    }

    logger.info(`Created ${created} attributes`);
    console.log(`\nSuccessfully created ${created} attributes.`);
    await db.destroy();
    process.exit(0);
  } catch (err: any) {
    console.error("Failed to create attributes:", err?.message ?? err);
    process.exit(1);
  }
}

runCreateAttributes();
