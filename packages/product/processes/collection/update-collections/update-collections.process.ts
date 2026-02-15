import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type UpdateCollectionProcessInput, UpdateCollectionSchema } from "./update-collections.schema";
import type { Database, ProductCollection } from "../../../db/type";

export const UPDATE_COLLECTIONS_PROCESS = Symbol("UpdateCollections");

@Process(UPDATE_COLLECTIONS_PROCESS)
export class UpdateCollectionsProcess
  implements ProcessContract<ProductCollection | undefined> {
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

    await this.validateCollection(input);
    await this.validateHandle(input);
    return this.updateCollection(input);
  }

  async validateCollection(input: UpdateCollectionProcessInput) {
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

  async validateHandle(input: UpdateCollectionProcessInput) {
    if (!input.handle) {
      return;
    }

    const existingCollection = await this.db
      .selectFrom("product_collections")
      .where("handle", "=", input.handle)
      .where("id", "!=", input.id)
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

  async updateCollection(input: UpdateCollectionProcessInput) {
    this.logger.info("Updating product collection", { input });

    const updateData: {
      title?: string;
      handle?: string;
      metadata?: unknown;
    } = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.handle !== undefined) {
      updateData.handle = input.handle;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    return this.db
      .updateTable("product_collections")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
