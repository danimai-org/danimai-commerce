import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  NotFoundError,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type UpdateProductTagProcessInput, type UpdateProductTagProcessOutput, UpdateProductTagSchema } from "./update-product-tag.schema";
import type { Database, ProductTag } from "../../../db/type";

export const UPDATE_PRODUCT_TAG_PROCESS = Symbol("UpdateProductTag");

@Process(UPDATE_PRODUCT_TAG_PROCESS)
export class UpdateProductTagProcess
  implements ProcessContract<typeof UpdateProductTagSchema, UpdateProductTagProcessOutput> {
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

    const tag = await this.db.selectFrom("product_tags")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!tag) {
      throw new NotFoundError("Product tag not found");
    }

    if (input.value !== undefined) {
      const existingTag = await this.db
        .selectFrom("product_tags")
        .where("value", "ilike", input.value)
        .where("deleted_at", "is", null)
        .where("id", "!=", input.id)
        .selectAll()
        .executeTakeFirst();

      if (existingTag) {
        throw new ValidationError("Product tag already exists", [{
          type: "already_exists",
          message: "Product tag already exists",
          path: "value",
        }]);
      }
    }

    return this.db.updateTable("product_tags")
      .set({
        ...input,
        updated_at: new Date(),
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirst();
  }
}
