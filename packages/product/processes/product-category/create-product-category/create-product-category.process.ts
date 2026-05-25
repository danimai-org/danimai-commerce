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

/**
 * Handles the create product category process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_PRODUCT_CATEGORY_PROCESS = Symbol("CreateProductCategory");

/**
 * Creates a product category after validating uniqueness and parent linkage.
 * Input: category value and optional parent/status/visibility/metadata.
 * Output: created or existing category row.
 */
@Process(CREATE_PRODUCT_CATEGORY_PROCESS)
export class CreateProductCategoryProcess
  implements ProcessContract<typeof CreateProductCategorySchema, CreateProductCategoryProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
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

    if (input.attributes) {
      const existingAttributes = await this.db
        .selectFrom("product_attributes")
        .where("id", "in", input.attributes.map((attr) => attr.id))
        .select("id")
        .execute();


      if (existingAttributes.length !== input.attributes.length) {
        throw new ValidationError("Some attributes do not exist", existingAttributes.map((attr) => ({
          type: "not_found",
          message: "Attribute not found",
          path: "attributes",
          value: attr.id,
        })));
      }

      await this.db
        .insertInto("product_category_attribute_relations")
        .values(input.attributes.map((attribute, index) => ({
          rank: index + 1,
          category_id: category.id,
          product_attribute_id: attribute.id,
          required: attribute.required,
        })))
        .execute();
    }

    return category;
  }

  private async generateHandle(value: string): Promise<string> {
    const baseHandle = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category";

    const existingHandles = await this.db
      .selectFrom("product_categories")
      .where("handle", "like", `${baseHandle}%`)
      .where("deleted_at", "is", null)
      .select("handle")
      .execute();

    const handleSet = new Set(existingHandles.map((row) => row.handle));
    if (!handleSet.has(baseHandle)) {
      return baseHandle;
    }

    let counter = 1;
    while (handleSet.has(`${baseHandle}-${counter}`)) {
      counter++;
    }

    return `${baseHandle}-${counter}`;
  }
}
