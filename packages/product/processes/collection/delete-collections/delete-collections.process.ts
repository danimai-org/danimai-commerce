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
import { type DeleteCollectionsProcessInput, DeleteCollectionsSchema } from "./delete-collections.schema";
import type { Database } from "../../../db/type";

export const DELETE_COLLECTIONS_PROCESS = Symbol("DeleteCollections");

@Process(DELETE_COLLECTIONS_PROCESS)
export class DeleteCollectionsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteCollectionsSchema,
  }) context: ProcessContextType<typeof DeleteCollectionsSchema>): Promise<void> {
    const { input } = context;

    await this.validateCollections(input);
    await this.deleteCollections(input);
  }

  async validateCollections(input: DeleteCollectionsProcessInput) {
    const collections = await this.db
      .selectFrom("product_collections")
      .where("id", "in", input.collection_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (collections.length !== input.collection_ids.length) {
      const foundIds = collections.map((c) => c.id);
      const missingIds = input.collection_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Collections not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Collections not found: ${missingIds.join(", ")}`,
          path: "collection_ids",
        }]
      );
    }

    return collections;
  }

  async deleteCollections(input: DeleteCollectionsProcessInput) {
    this.logger.info("Deleting product collections", {
      collection_ids: input.collection_ids,
    });

    await this.db
      .deleteFrom("product_collections")
      .where("id", "in", input.collection_ids)
      .execute();
  }
}
