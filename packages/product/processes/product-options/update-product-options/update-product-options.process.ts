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
import { type UpdateProductOptionProcessInput, UpdateProductOptionSchema } from "./update-product-options.schema";
import type { Database, ProductOption } from "../../../db/type";

export const UPDATE_PRODUCT_OPTIONS_PROCESS = Symbol("UpdateProductOptions");

@Process(UPDATE_PRODUCT_OPTIONS_PROCESS)
export class UpdateProductOptionsProcess
  implements ProcessContract<ProductOption | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductOptionSchema,
  }) context: ProcessContextType<typeof UpdateProductOptionSchema>) {
    const { input } = context;

    await this.validateOption(input);

    return this.updateProductOption(input);
  }

  async validateOption(input: UpdateProductOptionProcessInput) {
    const option = await this.db
      .selectFrom("product_options")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!option) {
      throw new ValidationError("Product option not found", [{
        type: "not_found",
        message: "Product option not found",
        path: "id",
      }]);
    }

    return option;
  }

  async updateProductOption(input: UpdateProductOptionProcessInput) {
    this.logger.info("Updating product option", { input });

    const updateData: {
      title?: string;
      metadata?: unknown;
    } = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    return this.db
      .updateTable("product_options")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
