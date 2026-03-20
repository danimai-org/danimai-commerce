import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { UpdateProductTagProductsSchema } from "./update-product-tag-products.schema";
import type { Database } from "../../../db/type";

export const UPDATE_PRODUCT_TAG_PRODUCTS_PROCESS = Symbol("UpdateProductTagProducts");

@Process(UPDATE_PRODUCT_TAG_PRODUCTS_PROCESS)
export class UpdateProductTagProductsProcess
  implements ProcessContract<typeof UpdateProductTagProductsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductTagProductsSchema,
  }) context: ProcessContextType<typeof UpdateProductTagProductsSchema>) {
    const { input } = context;
    const tag = await this.db.selectFrom("product_tags")
      .where("id", "=", input.product_tag_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!tag) {
      throw new NotFoundError("Product tag not found");
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
        .insertInto("product_tag_relations")
        .values(
          input.products.add.map((product_id) => ({
            product_id,
            product_tag_id: tag.id,
          }))
        )
        .onConflict((oc) => oc.columns(["product_id", "product_tag_id"]).doNothing())
        .execute();
    }

    if (input.products.remove.length > 0) {
      await this.db
        .deleteFrom("product_tag_relations")
        .where("product_tag_id", "=", tag.id)
        .where("product_id", "in", input.products.remove)
        .execute();
    }
  }
}
