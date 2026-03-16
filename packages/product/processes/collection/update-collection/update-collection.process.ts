import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  NotFoundError,
  ValidationError
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type UpdateCollectionProcessOutput, UpdateCollectionSchema } from "./update-collection.schema";
import type { Database } from "../../../db/type";

export const UPDATE_COLLECTION_PROCESS = Symbol("UpdateCollection");

@Process(UPDATE_COLLECTION_PROCESS)
export class UpdateCollectionProcess
  implements ProcessContract<typeof UpdateCollectionSchema, UpdateCollectionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateCollectionSchema,
  }) context: ProcessContextType<typeof UpdateCollectionSchema>) {
    const { input } = context;

    const collections = await this.db.selectFrom("product_collections")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!collections) {
      throw new NotFoundError("Collection not found");
    }

    if (input.title !== undefined) {
      const existingCollection = await this.db
        .selectFrom("product_collections")
        .where("title", "ilike", input.title)
        .where("deleted_at", "is", null)
        .where("id", "!=", input.id)
        .selectAll()
        .executeTakeFirst();

      if (existingCollection) {
        throw new ValidationError("Collection title already exists", [{
          type: "already_exists",
          message: "Collection title already exists",
          path: "title",
        }]);
      }
    }

    if (input.handle !== undefined) {
      const existingCollection = await this.db
        .selectFrom("product_collections")
        .where("handle", "=", input.handle)
        .where("deleted_at", "is", null)
        .where("id", "!=", input.id)
        .selectAll()
        .executeTakeFirst();

      if (existingCollection) {
        throw new ValidationError("Collection handle already exists", [{
          type: "already_exists",
          message: "Collection handle already exists",
          path: "handle",
        }]);
      }
    }

    return this.db
      .updateTable("product_collections")
      .set({
        ...input,
        updated_at: new Date(),
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirst();
  }
}
