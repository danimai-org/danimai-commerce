import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  UpdateCollectionProductsSchema,
} from "./update-collection-products.schema";
import type { Database } from "../../../db/type";

export const UPDATE_COLLECTION_PRODUCTS_PROCESS = Symbol(
  "UpdateCollectionProducts"
);

@Process(UPDATE_COLLECTION_PRODUCTS_PROCESS)
export class UpdateCollectionProductsProcess
  implements ProcessContract<typeof UpdateCollectionProductsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

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

    // validate products
    const products = await this.db
      .selectFrom("products")
      .where("id", "in", Array.from(uniqueProductIds))
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (products.length !== uniqueProductIds.size) {
      throw new NotFoundError("Products not found");
    }

    // add products to collection
    await this.db
      .insertInto("product_collection_relations")
      .values(products.map((p) => ({
        product_id: p.id,
        product_collection_id: collection.id,
      })))
      .onConflict((oc) => oc.columns([
        "product_id",
        "product_collection_id",
      ]).doNothing())
      .execute();

    // remove products from collection
    await this.db
      .deleteFrom("product_collection_relations")
      .where("product_id", "in", input.products.remove)
      .where("product_collection_id", "=", collection.id)
      .execute();

  }

}
