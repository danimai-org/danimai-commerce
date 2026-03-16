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
import { type CreateCollectionProcessInput, type CreateCollectionProcessOutput, CreateCollectionSchema } from "./create-collection.schema";
import type { Database } from "../../../db/type";
import { slugify } from "@danimai/core";
import { randomUUID } from "crypto";
export const CREATE_COLLECTION_PROCESS = Symbol("CreateCollection");

@Process(CREATE_COLLECTION_PROCESS)
export class CreateCollectionProcess
  implements ProcessContract<typeof CreateCollectionSchema, CreateCollectionProcessOutput> {
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

    const handleOrNameAlreadyExists = await this.db
      .selectFrom("product_collections")
      .where((eb) => {
        const conditions = [eb("title", "ilike", `%${input.title}%`)];
        if (input.handle) {
          conditions.push(eb("handle", "=", input.handle));
        }
        return eb.or(conditions);
      })
      .selectAll()
      .executeTakeFirst();
    if (handleOrNameAlreadyExists) {
      throw new ValidationError("Collection handle or name already exists", [{
        type: "already_exists",
        message: "Collection handle or name already exists",
        path: "handle",
      }]);
    }

    const handle = input.handle ? slugify(input.handle) : slugify(input.title);

    return this.db
      .insertInto("product_collections")
      .values({
        ...input,
        handle,
        id: randomUUID(),
      })
      .returningAll()
      .executeTakeFirst();
  }
}
