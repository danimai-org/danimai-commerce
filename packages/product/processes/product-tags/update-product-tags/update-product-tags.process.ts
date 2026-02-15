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
import { type UpdateProductTagProcessInput, UpdateProductTagSchema } from "./update-product-tags.schema";
import type { Database, ProductTag } from "../../../db/type";

export const UPDATE_PRODUCT_TAGS_PROCESS = Symbol("UpdateProductTags");

@Process(UPDATE_PRODUCT_TAGS_PROCESS)
export class UpdateProductTagsProcess
  implements ProcessContract<ProductTag | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductTagSchema,
  }) context: ProcessContextType<typeof UpdateProductTagSchema>) {
    const { input } = context;

    await this.validateTag(input);

    return this.updateProductTag(input);
  }

  async validateTag(input: UpdateProductTagProcessInput) {
    const tag = await this.db
      .selectFrom("product_tags")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!tag) {
      throw new ValidationError("Product tag not found", [{
        type: "not_found",
        message: "Product tag not found",
        path: "id",
      }]);
    }

    return tag;
  }

  async updateProductTag(input: UpdateProductTagProcessInput) {
    this.logger.info("Updating product tag", { input });

    const updateData: {
      value?: string;
      metadata?: unknown;
    } = {};

    if (input.value !== undefined) {
      updateData.value = input.value;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    return this.db
      .updateTable("product_tags")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
