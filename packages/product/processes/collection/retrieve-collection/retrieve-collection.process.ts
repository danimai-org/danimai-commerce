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

export const RETRIEVE_COLLECTION_PROCESS = Symbol("RetrieveCollection");

@Process(RETRIEVE_COLLECTION_PROCESS)
export class RetrieveCollectionProcess
  implements ProcessContract<typeof RetrieveCollectionSchema, RetrieveCollectionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

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
