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
import { type RetrieveCollectionProcessInput, RetrieveCollectionSchema } from "./retrieve-collection.schema";
import type { Database, ProductCollection } from "../../../db/type";

export const RETRIEVE_COLLECTION_PROCESS = Symbol("RetrieveCollection");

@Process(RETRIEVE_COLLECTION_PROCESS)
export class RetrieveCollectionProcess
  implements ProcessContract<ProductCollection | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveCollectionSchema,
  }) context: ProcessContextType<typeof RetrieveCollectionSchema>) {
    const { input } = context;

    const collection = await this.db
      .selectFrom("product_collections")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!collection) {
      throw new ValidationError("Collection not found", [{
        type: "not_found",
        message: "Collection not found",
        path: "id",
      }]);
    }

    return collection;
  }
}
