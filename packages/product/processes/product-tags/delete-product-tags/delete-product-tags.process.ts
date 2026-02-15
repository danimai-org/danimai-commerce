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
import { type DeleteProductTagsProcessInput, DeleteProductTagsSchema } from "./delete-product-tags.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_TAGS_PROCESS = Symbol("DeleteProductTags");

@Process(DELETE_PRODUCT_TAGS_PROCESS)
export class DeleteProductTagsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductTagsSchema,
  }) context: ProcessContextType<typeof DeleteProductTagsSchema>): Promise<void> {
    const { input } = context;

    await this.validateTags(input);
    await this.deleteTags(input);
  }

  async validateTags(input: DeleteProductTagsProcessInput) {
    const tags = await this.db
      .selectFrom("product_tags")
      .where("id", "in", input.tag_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (tags.length !== input.tag_ids.length) {
      const foundIds = tags.map((t) => t.id);
      const missingIds = input.tag_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Product tags not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Product tags not found: ${missingIds.join(", ")}`,
          path: "tag_ids",
        }]
      );
    }

    return tags;
  }

  async deleteTags(input: DeleteProductTagsProcessInput) {
    this.logger.info("Deleting product tags", {
      tag_ids: input.tag_ids,
    });

    // Soft delete the tags
    await this.db
      .updateTable("product_tags")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.tag_ids)
      .where("deleted_at", "is", null)
      .execute();

    // Note: We don't delete the product_tag_relations because
    // the relations can remain even if the tag is soft-deleted
    // This allows for data integrity and potential recovery
  }
}
