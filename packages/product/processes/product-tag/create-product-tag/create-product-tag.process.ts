import {
  InjectDB,
  InjectLogger,
  InternalServerError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { CreateProductTagSchema, type CreateProductTagsProcessOutput } from "./create-product-tag.schema";
import type { Database } from "../../../db/type";
import { randomUUID } from "crypto";
/**
 * Handles the create product tags process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_PRODUCT_TAGS_PROCESS = Symbol("CreateProductTags");

@Process(CREATE_PRODUCT_TAGS_PROCESS)
export class CreateProductTagsProcess
  implements ProcessContract<typeof CreateProductTagSchema, CreateProductTagsProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: CreateProductTagSchema,
  }) context: ProcessContextType<typeof CreateProductTagSchema>) {
    const { input } = context;
    const existingTag = await this.db
      .selectFrom("product_tags")
      .where("value", "ilike", input.value)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (existingTag) {
      return existingTag;
    }

    const tag = await this.db
      .insertInto("product_tags")
      .values({
        ...input,
      })
      .returningAll()
      .executeTakeFirst();

    if (!tag) {
      throw new InternalServerError("Failed to create product tag");
    }
    return tag;
  }
}
