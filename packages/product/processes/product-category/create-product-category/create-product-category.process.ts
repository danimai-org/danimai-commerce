import {
  InjectDB,
  InternalServerError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import { type CreateProductCategoryProcessOutput, CreateProductCategorySchema } from "./create-product-category.schema";
import type { Database } from "../../../db/type";
import { ProductCategoryStatus, ProductCategoryVisibility } from "../../../db/type";

export const CREATE_PRODUCT_CATEGORY_PROCESS = Symbol("CreateProductCategory");

@Process(CREATE_PRODUCT_CATEGORY_PROCESS)
export class CreateProductCategoryProcess
  implements ProcessContract<typeof CreateProductCategorySchema, CreateProductCategoryProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductCategorySchema,
  }) context: ProcessContextType<typeof CreateProductCategorySchema>) {
    const { input } = context;

    const existingCategory = await this.db
      .selectFrom("product_categories")
      .where("value", "ilike", input.value)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (existingCategory) {
      return existingCategory;
    }

    const parentId = input.parent_id && input.parent_id.trim() !== ""
      ? input.parent_id
      : null;

    if (parentId) {
      const parentCategory = await this.db
        .selectFrom("product_categories")
        .where("id", "=", parentId)
        .selectAll()
        .executeTakeFirst();

      if (!parentCategory) {
        throw new ValidationError("Parent category not found", [{
          type: "not_found",
          message: "Parent category not found",
          path: "parent_id",
        }]);
      }
    }

    const handle = await this.generateHandle(input.value);

    const category = await this.db
      .insertInto("product_categories")
      .values({
        value: input.value,
        handle,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        parent_id: parentId,
        status: input.status ?? ProductCategoryStatus.ACTIVE,
        visibility: input.visibility ?? ProductCategoryVisibility.PUBLIC,
      })
      .returningAll()
      .executeTakeFirst();

    if (!category) {
      throw new InternalServerError("Failed to create product category");
    }

    return category;
  }

  private async generateHandle(value: string): Promise<string> {
    const baseHandle = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category";

    let handle = baseHandle;
    let counter = 1;

    while (true) {
      const existing = await this.db
        .selectFrom("product_categories")
        .where("handle", "=", handle)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (!existing) {
        break;
      }

      handle = `${baseHandle}-${counter}`;
      counter++;
    }

    return handle;
  }
}
