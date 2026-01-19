import {
  InjectDB,
  InjectLogger,
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import type { CreateProductCategoryInput } from "./create-product-categories.schema";
import type { Database, ProductCategory } from "../../db/type";
import { randomUUID } from "node:crypto";

@Process("CreateProductCategories")
export class CreateProductCategoriesProcess
  implements ProcessContract<ProductCategory | undefined>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(context: ProcessContext) {
    const { input } = context as any;
    return this.createProductCategory(input);
  }

  async createProductCategory(input: CreateProductCategoryInput) {
    this.logger.info("Validating product category", { input });

    // validate parent_id
    let parentCategory: ProductCategory | undefined;

    if (input.parent_id) {
      parentCategory = await this.db
        .selectFrom("product_categories")
        .where("id", "=", input.parent_id)
        .selectAll()
        .executeTakeFirst();
    }

    // create product category and return
    return this.db
      .insertInto("product_categories")
      .values({
        ...input,
        id: randomUUID(),
        parent_id: parentCategory?.id ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
