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
import { type CreateProductCategoryProcessInput, CreateProductCategorySchema } from "./create-product-categories.schema";
import type { Database, ProductCategory } from "../../../db/type";

export const CREATE_PRODUCT_CATEGORIES_PROCESS = Symbol("CreateProductCategories");

@Process(CREATE_PRODUCT_CATEGORIES_PROCESS)
export class CreateProductCategoriesProcess
  implements ProcessContract<ProductCategory | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductCategorySchema,
  }) context: ProcessContextType<typeof CreateProductCategorySchema>) {
    const { input } = context;

    // Normalize parent_id: convert empty strings to null
    const parentId = input.parent_id && input.parent_id.trim() !== ""
      ? input.parent_id
      : null;

    const parentCategory = parentId
      ? await this.db
        .selectFrom("product_categories")
        .where("id", "=", parentId)
        .selectAll()
        .executeTakeFirst()
      : null;

    if (parentId && !parentCategory) {
      throw new ValidationError("Parent category not found", [{
        type: "not_found",
        message: "Parent category not found",
        path: "parent_id",
      }]);
    }

    return this.createProductCategory(input, parentCategory as ProductCategory | null);
  }

  async generateHandle(value: string): Promise<string> {
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

  async createProductCategory(input: CreateProductCategoryProcessInput, parentCategory: ProductCategory | null) {
    this.logger.info("Validating product category", { input });

    const handle = await this.generateHandle(input.value);

    // Normalize parent_id: ensure empty strings become null
    const parentId = input.parent_id && input.parent_id.trim() !== ""
      ? input.parent_id
      : null;

    // Explicitly construct the insert object with only the fields we need
    // id is generated using database function, created_at and updated_at are Generated fields and will be set by the database
    return this.db
      .insertInto("product_categories")
      .values({
        id: sql`gen_random_uuid()`,
        value: input.value,
        handle,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        parent_id: parentCategory?.id ?? parentId ?? null,
        status: input.status ?? "active",
        visibility: input.visibility ?? "public",
      })
      .returningAll()
      .executeTakeFirst();
  }
}
