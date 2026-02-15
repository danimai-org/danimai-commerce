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
import {
  type BatchRemoveProductsFromCollectionProcessInput,
  BatchRemoveProductsFromCollectionSchema,
} from "./batch-remove-products-from-collection.schema";
import type { Database } from "../../../db/type";

export const BATCH_REMOVE_PRODUCTS_FROM_COLLECTION_PROCESS = Symbol(
  "BatchRemoveProductsFromCollection"
);

@Process(BATCH_REMOVE_PRODUCTS_FROM_COLLECTION_PROCESS)
export class BatchRemoveProductsFromCollectionProcess
  implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(@ProcessContext({
    schema: BatchRemoveProductsFromCollectionSchema,
  }) context: ProcessContextType<typeof BatchRemoveProductsFromCollectionSchema>) {
    const { input } = context;

    await this.validateCollection(input);
    await this.removeProductsFromCollection(input);
  }

  async validateCollection(input: BatchRemoveProductsFromCollectionProcessInput) {
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

  async removeProductsFromCollection(
    input: BatchRemoveProductsFromCollectionProcessInput
  ) {
    this.logger.info("Removing products from collection", {
      product_ids: input.product_ids,
      collection_id: input.collection_id,
    });

    if (input.product_ids.length === 0) {
      return;
    }

    await this.db
      .deleteFrom("product_collection_relations")
      .where("product_collection_id", "=", input.collection_id)
      .where("product_id", "in", input.product_ids)
      .execute();
  }
}
