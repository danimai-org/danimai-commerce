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
import { type CreateProductAttributeProcessInput, CreateProductAttributeSchema } from "./create-product-attributes.schema";
import type { Database, ProductAttribute } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_ATTRIBUTES_PROCESS = Symbol("CreateProductAttributes");

@Process(CREATE_PRODUCT_ATTRIBUTES_PROCESS)
export class CreateProductAttributesProcess
  implements ProcessContract<ProductAttribute | undefined> {
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

    return this.createProductAttribute(input);
  }

  async createProductAttribute(input: CreateProductAttributeProcessInput) {
    this.logger.info("Creating product attribute", { input });

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
