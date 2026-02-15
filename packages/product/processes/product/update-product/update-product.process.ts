import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { randomUUID } from "crypto";
import { type UpdateProductProcessInput, UpdateProductSchema } from "./update-product.schema";
import type { Database, Product } from "../../../db/type";

export const UPDATE_PRODUCT_PROCESS = Symbol("UpdateProduct");

@Process(UPDATE_PRODUCT_PROCESS)
export class UpdateProductProcess
  implements ProcessContract<Product | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductSchema,
  }) context: ProcessContextType<typeof UpdateProductSchema>) {
    const { input } = context;

    await this.validateProduct(input);
    const category = await this.validateCategory(input);
    const handle = await this.validateHandle(input);
    if (input.attributes !== undefined) {
      await this.validateAttributeIds(input.attributes.map((a) => a.attribute_id));
    }
    if (input.tag_ids !== undefined) {
      await this.validateTagIds(input.tag_ids);
    }
    if (input.collection_ids !== undefined) {
      await this.validateCollectionIds(input.collection_ids);
    }

    const updated = await this.updateProduct(input, category, handle);
    if (input.attributes !== undefined) {
      await this.syncAttributeValues(input.id, input.attributes);
    }
    if (input.tag_ids !== undefined) {
      await this.syncProductTags(input.id, input.tag_ids);
    }
    if (input.collection_ids !== undefined) {
      await this.syncProductCollections(input.id, input.collection_ids);
    }
    return updated ?? (await this.db.selectFrom("products").where("id", "=", input.id).where("deleted_at", "is", null).selectAll().executeTakeFirst());
  }

  async validateProduct(input: UpdateProductProcessInput) {
    const product = await this.db
      .selectFrom("products")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!product) {
      throw new ValidationError("Product not found", [{
        type: "not_found",
        message: "Product not found",
        path: "id",
      }]);
    }

    return product;
  }

  async validateCategory(input: UpdateProductProcessInput) {
    if (!input.category_id) {
      return null;
    }

    const category = await this.db
      .selectFrom("product_categories")
      .where("id", "=", input.category_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!category) {
      throw new ValidationError("Category not found", [{
        type: "not_found",
        message: "Category not found",
        path: "category_id",
      }]);
    }

    return category;
  }

  async validateHandle(input: UpdateProductProcessInput): Promise<string | undefined> {
    if (!input.handle) {
      return undefined;
    }

    const existing = await this.db
      .selectFrom("products")
      .where("handle", "=", input.handle)
      .where("id", "!=", input.id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existing) {
      throw new ValidationError("Product handle already exists", [{
        type: "not_unique",
        message: "Product handle already exists",
        path: "handle",
      }]);
    }

    return input.handle;
  }

  async updateProduct(
    input: UpdateProductProcessInput,
    category: { id: string } | null,
    handle: string | undefined
  ) {
    this.logger.info("Updating product", { input });

    const updateData: {
      title?: string;
      handle?: string;
      subtitle?: string | null;
      description?: string | null;
      is_giftcard?: boolean;
      discountable?: boolean;
      status?: "draft" | "proposed" | "published" | "rejected";
      thumbnail?: string | null;
      external_id?: string | null;
      category_id?: string | null;
      metadata?: unknown;
    } = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (handle !== undefined) {
      updateData.handle = handle;
    }

    if (input.subtitle !== undefined) {
      updateData.subtitle = input.subtitle ?? null;
    }

    if (input.description !== undefined) {
      updateData.description = input.description ?? null;
    }

    if (input.is_giftcard !== undefined) {
      updateData.is_giftcard = input.is_giftcard;
    }

    if (input.discountable !== undefined) {
      updateData.discountable = input.discountable;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.thumbnail !== undefined) {
      updateData.thumbnail = input.thumbnail ?? null;
    }

    if (input.external_id !== undefined) {
      updateData.external_id = input.external_id ?? null;
    }

    if (input.category_id !== undefined) {
      updateData.category_id = category?.id ?? null;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    if (Object.keys(updateData).length === 0) {
      return undefined;
    }

    return this.db
      .updateTable("products")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }

  async validateAttributeIds(attributeIds: string[]) {
    if (attributeIds.length === 0) return;
    const existing = await this.db
      .selectFrom("product_attributes")
      .where("id", "in", attributeIds)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();
    const found = new Set(existing.map((r) => r.id));
    const missing = attributeIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new ValidationError("One or more attributes not found", [{
        type: "not_found",
        message: `Attributes not found: ${missing.join(", ")}`,
        path: "attributes",
      }]);
    }
  }

  async syncAttributeValues(
    productId: string,
    attributes: Array<{ attribute_id: string; value: string }>
  ) {
    await this.db
      .deleteFrom("product_attribute_values")
      .where("product_id", "=", productId)
      .execute();

    if (attributes.length === 0) return;

    const values = attributes.map((a) => ({
      id: randomUUID(),
      attribute_id: a.attribute_id,
      product_id: productId,
      value: a.value,
      metadata: null,
      deleted_at: null,
    }));

    await this.db
      .insertInto("product_attribute_values")
      .values(values)
      .execute();
  }

  async validateTagIds(tagIds: string[]) {
    if (tagIds.length === 0) return;
    const existing = await this.db
      .selectFrom("product_tags")
      .where("id", "in", tagIds)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();
    const found = new Set(existing.map((r) => r.id));
    const missing = tagIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new ValidationError("One or more tags not found", [{
        type: "not_found",
        message: `Tags not found: ${missing.join(", ")}`,
        path: "tag_ids",
      }]);
    }
  }

  async syncProductTags(productId: string, tagIds: string[]) {
    await this.db
      .deleteFrom("product_tag_relations")
      .where("product_id", "=", productId)
      .execute();

    if (tagIds.length === 0) return;

    const relations = tagIds.map((product_tag_id) => ({
      product_id: productId,
      product_tag_id,
    }));
    await this.db
      .insertInto("product_tag_relations")
      .values(relations)
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  async validateCollectionIds(collectionIds: string[]) {
    if (collectionIds.length === 0) return;
    const existing = await this.db
      .selectFrom("product_collections")
      .where("id", "in", collectionIds)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();
    const found = new Set(existing.map((r) => r.id));
    const missing = collectionIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new ValidationError("One or more collections not found", [{
        type: "not_found",
        message: `Collections not found: ${missing.join(", ")}`,
        path: "collection_ids",
      }]);
    }
  }

  async syncProductCollections(productId: string, collectionIds: string[]) {
    await this.db
      .deleteFrom("product_collection_relations")
      .where("product_id", "=", productId)
      .execute();

    if (collectionIds.length === 0) return;

    const relations = collectionIds.map((product_collection_id) => ({
      product_id: productId,
      product_collection_id,
    }));
    await this.db
      .insertInto("product_collection_relations")
      .values(relations)
      .onConflict((oc) => oc.columns(["product_id", "product_collection_id"]).doNothing())
      .execute();
  }
}
