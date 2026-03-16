import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { DeleteProductTagsSchema } from "./delete-product-tags.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_TAGS_PROCESS = Symbol("DeleteProductTags");

@Process(DELETE_PRODUCT_TAGS_PROCESS)
export class DeleteProductTagsProcess implements ProcessContract<typeof DeleteProductTagsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductTagsSchema,
  }) context: ProcessContextType<typeof DeleteProductTagsSchema>) {
    const { input } = context;

    const tags = await this.db
      .selectFrom("product_tags")
      .where("id", "in", input.tag_ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (tags.length !== input.tag_ids.length) {
      const foundIds = tags.map((t) => t.id);
      const missingIds = input.tag_ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(
        `Product tags not found: ${missingIds.join(", ")}`
      );
    }

    await this.db.transaction().execute(async (trx) => {
      this.logger.info("Deleting product tags", {
        tag_ids: input.tag_ids,
      });
      await trx
        .updateTable("product_tags")
        .set({ deleted_at: new Date() })
        .where("id", "in", input.tag_ids)
        .where("deleted_at", "is", null)
        .execute();
    });
  }
}
