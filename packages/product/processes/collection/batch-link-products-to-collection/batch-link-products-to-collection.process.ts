import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type BatchLinkProductsToCollectionProcessInput, BatchLinkProductsToCollectionSchema } from "./batch-link-products-to-collection.schema";
import type { Database } from "../../../db/type";

export const BATCH_LINK_PRODUCTS_TO_COLLECTION_PROCESS = Symbol("BatchLinkProductsToCollection");

@Process(BATCH_LINK_PRODUCTS_TO_COLLECTION_PROCESS)
export class BatchLinkProductsToCollectionProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: BatchLinkProductsToCollectionSchema,
  }) context: ProcessContextType<typeof BatchLinkProductsToCollectionSchema>) {
    const { input } = context;

    await this.validateCollection(input);
    await this.validateProducts(input);
    await this.linkProductsToCollection(input);
  }

  async validateCollection(input: BatchLinkProductsToCollectionProcessInput) {
    const collection = await this.db
      .selectFrom("product_collections")
      .where("id", "=", input.collection_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!collection) {
      throw new ValidationError("Collection not found", [{
        type: "not_found",
        message: "Collection not found",
        path: "collection_id",
      }]);
    }

    return collection;
  }

  async validateProducts(input: BatchLinkProductsToCollectionProcessInput) {
    const products = await this.db
      .selectFrom("products")
      .where("id", "in", input.product_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (products.length !== input.product_ids.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = input.product_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Products not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Products not found: ${missingIds.join(", ")}`,
          path: "product_ids",
        }]
      );
    }

    return products;
  }

  async linkProductsToCollection(input: BatchLinkProductsToCollectionProcessInput) {
    this.logger.info("Linking products to collection", {
      product_ids: input.product_ids,
      collection_id: input.collection_id,
    });

    // Insert into pivot table, ignoring duplicates
    const relations = input.product_ids.map((product_id) => ({
      product_id,
      product_collection_id: input.collection_id,
    }));

    await this.db
      .insertInto("product_collection_relations")
      .values(relations)
      .onConflict((oc) => oc
        .columns(["product_id", "product_collection_id"])
        .doNothing()
      )
      .execute();
  }
}
