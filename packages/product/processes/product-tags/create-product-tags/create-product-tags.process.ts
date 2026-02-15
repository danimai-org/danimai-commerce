import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type CreateProductTagProcessInput, CreateProductTagSchema } from "./create-product-tags.schema";
import type { Database, ProductTag } from "../../../db/type";
import { randomUUID } from "crypto";
export const CREATE_PRODUCT_TAGS_PROCESS = Symbol("CreateProductTags");

@Process(CREATE_PRODUCT_TAGS_PROCESS)
export class CreateProductTagsProcess
  implements ProcessContract<ProductTag | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductTagSchema,
  }) context: ProcessContextType<typeof CreateProductTagSchema>) {
    const { input } = context;

    return this.createProductTag(input);
  }

  async createProductTag(input: CreateProductTagProcessInput) {
    this.logger.info("Creating product tag", { input });

    return this.db
      .insertInto("product_tags")
      .values({
        ...input,
        id: randomUUID(),
      })
      .returningAll()
      .executeTakeFirst();
  }
}
