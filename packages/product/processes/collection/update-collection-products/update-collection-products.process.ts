import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  UpdateCollectionProductsSchema,
} from "./update-collection-products.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the update collection products process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_COLLECTION_PRODUCTS_PROCESS = Symbol(
  "UpdateCollectionProducts"
);

@Process(UPDATE_COLLECTION_PRODUCTS_PROCESS)
export class UpdateCollectionProductsProcess
  implements ProcessContract<typeof UpdateCollectionProductsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: UpdateCollectionProductsSchema,
  }) context: ProcessContextType<typeof UpdateCollectionProductsSchema>) {
    const { input } = context;
    const collection = await this.db.selectFrom("product_collections")
      .where("id", "=", input.collection_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }
    const uniqueProductIds = new Set([...input.products.add, ...input.products.remove]);

    if (uniqueProductIds.size === 0) {
      return;
    }

    const products = await this.db
      .selectFrom("products")
      .where("id", "in", Array.from(uniqueProductIds))
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (products.length !== uniqueProductIds.size) {
      throw new NotFoundError("Products not found");
    }

    if (input.products.add.length > 0) {
      await this.db
        .insertInto("product_collection_relations")
        .values(
          input.products.add.map((product_id) => ({
            product_id,
            product_collection_id: collection.id,
          }))
        )
        .onConflict((oc) => oc.columns([
          "product_id",
          "product_collection_id",
        ]).doNothing())
        .execute();
    }

    if (input.products.remove.length > 0) {
      await this.db
        .deleteFrom("product_collection_relations")
        .where("product_id", "in", input.products.remove)
        .where("product_collection_id", "=", collection.id)
        .execute();
    }
  }

}
