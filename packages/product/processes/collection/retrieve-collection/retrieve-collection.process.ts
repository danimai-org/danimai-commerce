import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
  import { type RetrieveCollectionProcessOutput, RetrieveCollectionSchema } from "./retrieve-collection.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the retrieve collection process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_COLLECTION_PROCESS = Symbol("RetrieveCollection");

@Process(RETRIEVE_COLLECTION_PROCESS)
export class RetrieveCollectionProcess
  implements ProcessContract<typeof RetrieveCollectionSchema, RetrieveCollectionProcessOutput> {
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
    schema: RetrieveCollectionSchema,
  }) context: ProcessContextType<typeof RetrieveCollectionSchema>) {
    const { input } = context;

    const collection = await this.db
      .selectFrom("product_collections")
      .where("product_collections.id", "=", input.id)
      .where("product_collections.deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    return collection;
  }
}
