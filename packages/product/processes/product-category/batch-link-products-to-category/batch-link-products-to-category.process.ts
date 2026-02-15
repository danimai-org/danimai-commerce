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
import { type BatchLinkProductsToCategoryProcessInput, BatchLinkProductsToCategorySchema } from "./batch-link-products-to-category.schema";
import type { Database } from "../../../db/type";

export const BATCH_LINK_PRODUCTS_TO_CATEGORY_PROCESS = Symbol("BatchLinkProductsToCategory");

@Process(BATCH_LINK_PRODUCTS_TO_CATEGORY_PROCESS)
export class BatchLinkProductsToCategoryProcess implements ProcessContract<void> {

  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: BatchLinkProductsToCategorySchema,
  }) context: ProcessContextType<typeof BatchLinkProductsToCategorySchema>) {
    const { input } = context;

    await this.validateCategory(input);
    await this.validateProducts(input);
    await this.linkProductsToCategory(input);
  }

  async validateCategory(input: BatchLinkProductsToCategoryProcessInput) {
    const category = await this.db
      .selectFrom("product_categories")
      .where("id", "=", input.category_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!category) {
      throw new ValidationError("Category not found", [{
        type: "not_found",
        message: "Category not found",
        path: "category_id",
      }]);
    }

    return category;
  }

  async validateProducts(input: BatchLinkProductsToCategoryProcessInput) {
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

  async linkProductsToCategory(input: BatchLinkProductsToCategoryProcessInput) {
    this.logger.info("Linking products to category", {
      product_ids: input.product_ids,
      category_id: input.category_id,
    });

    await this.db
      .updateTable("products")
      .set({ category_id: input.category_id })
      .where("id", "in", input.product_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
