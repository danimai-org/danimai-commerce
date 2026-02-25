import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import type { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type DeleteProductsProcessInput, DeleteProductsSchema } from "./delete-products.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCTS_PROCESS = Symbol("DeleteProducts");

@Process(DELETE_PRODUCTS_PROCESS)
export class DeleteProductsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductsSchema,
  }) context: ProcessContextType<typeof DeleteProductsSchema>): Promise<void> {
    const { input } = context;

    await this.validateProducts(input);
    await this.db.transaction().execute(async (trx) => {
      await this.deleteProducts(trx, input);
    });
  }

  async validateProducts(input: DeleteProductsProcessInput) {
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

  async deleteProducts(trx: Kysely<Database>, input: DeleteProductsProcessInput) {
    this.logger.info("Hard deleting products", {
      product_ids: input.product_ids,
    });

    const productIds = input.product_ids;

    const variantIds = await trx
      .selectFrom("product_variants")
      .where("product_id", "in", productIds)
      .select("id")
      .execute()
      .then((rows) => rows.map((r) => r.id));

    if (variantIds.length > 0) {
      await trx
        .deleteFrom("product_variant_option_relations")
        .where("variant_id", "in", variantIds)
        .execute();
      await trx
        .deleteFrom("product_variant_image_relations")
        .where("variant_id", "in", variantIds)
        .execute();
    }

    await trx
      .deleteFrom("product_variants")
      .where("product_id", "in", productIds)
      .execute();

    await trx
      .deleteFrom("product_option_values")
      .where("product_id", "in", productIds)
      .execute();

    await trx
      .deleteFrom("product_attribute_values")
      .where("product_id", "in", productIds)
      .execute();

    await trx
      .deleteFrom("product_attribute_group_relations")
      .where("product_id", "in", productIds)
      .execute();

    await trx
      .deleteFrom("product_tag_relations")
      .where("product_id", "in", productIds)
      .execute();

    await trx
      .deleteFrom("product_collection_relations")
      .where("product_id", "in", productIds)
      .execute();

    await trx
      .deleteFrom("product_images")
      .where("product_id", "in", productIds)
      .execute();

    await trx
      .deleteFrom("products")
      .where("id", "in", productIds)
      .execute();
  }
}
