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
import { type CreateProductAttributeGroupProcessInput, CreateProductAttributeGroupSchema } from "./create-product-attribute-groups.schema";
import type { Database, ProductAttributeGroup } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS = Symbol("CreateProductAttributeGroups");

@Process(CREATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS)
export class CreateProductAttributeGroupsProcess
  implements ProcessContract<ProductAttributeGroup | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductAttributeGroupSchema,
  }) context: ProcessContextType<typeof CreateProductAttributeGroupSchema>) {
    const { input } = context;

    return this.createProductAttributeGroup(input);
  }

  async createProductAttributeGroup(input: CreateProductAttributeGroupProcessInput) {
    this.logger.info("Creating product attribute group", { input });

    return this.db
      .insertInto("product_attribute_groups")
      .values({
        id: randomUUID(),
        title: input.title,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
