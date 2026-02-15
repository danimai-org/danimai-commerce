import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type CreateCollectionProcessInput, CreateCollectionSchema } from "./create-collections.schema";
import type { Database, ProductCollection } from "../../../db/type";

export const CREATE_COLLECTIONS_PROCESS = Symbol("CreateCollections");

@Process(CREATE_COLLECTIONS_PROCESS)
export class CreateCollectionsProcess
  implements ProcessContract<ProductCollection | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateCollectionSchema,
  }) context: ProcessContextType<typeof CreateCollectionSchema>) {
    const { input } = context;

    await this.validateHandle(input);
    return this.createCollection(input);
  }

  async validateHandle(input: CreateCollectionProcessInput) {
    const existingCollection = await this.db
      .selectFrom("product_collections")
      .where("handle", "=", input.handle)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (existingCollection) {
      throw new ValidationError("Collection handle already exists", [{
        type: "not_found",
        message: "Collection handle already exists",
        path: "handle",
      }]);
    }
  }

  async createCollection(input: CreateCollectionProcessInput) {
    this.logger.info("Creating product collection", { input });

    return this.db
      .insertInto("product_collections")
      .values({
        ...input,
        id: sql`gen_random_uuid()`,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
