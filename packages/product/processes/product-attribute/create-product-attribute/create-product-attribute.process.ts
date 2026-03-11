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
import { CreateProductAttributeSchema, type CreateProductAttributeProcessOutput } from "./create-product-attribute.schema";
import type { Database } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_ATTRIBUTE_PROCESS = Symbol("CreateProductAttribute");

@Process(CREATE_PRODUCT_ATTRIBUTE_PROCESS)
export class CreateProductAttributeProcess
  implements ProcessContract<typeof CreateProductAttributeSchema, CreateProductAttributeProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductAttributeSchema,
  }) context: ProcessContextType<typeof CreateProductAttributeSchema>) {
    const { input } = context;

    const existingAttribute = await this.db
      .selectFrom("product_attributes")
      .where("title", "ilike", input.title)
      .where("type", "=", input.type)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (existingAttribute) {
      return existingAttribute;
    }


    return this.db
      .insertInto("product_attributes")
      .values({
        ...input,
        id: randomUUID(),
      })
      .returningAll()
      .executeTakeFirst();
  }

}
