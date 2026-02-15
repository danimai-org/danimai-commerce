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
import { type CreateProductProcessInput, CreateProductSchema } from "./create-product.schema";
import type { Database, Product } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_PROCESS = Symbol("CreateProduct");

@Process(CREATE_PRODUCT_PROCESS)
export class CreateProductProcess
  implements ProcessContract<Product | undefined> {

  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductSchema,
  }) context: ProcessContextType<typeof CreateProductSchema>) {
    const { input } = context;

    return this.db.transaction().execute(async (trx) => {
      const category = await this.validateCategory(trx, input);
      const handle = await this.generateHandle(trx, input);
      const product = await this.createProduct(trx, input, category, handle);

      if (!product) {
        return product;
      }

      // Create product options and option values
      const optionMap = await this.createProductOptions(trx, product.id, input.options || []);

      // Create product variants with options and prices
      if (input.variants && input.variants.length > 0) {
        await this.createProductVariants(trx, product.id, input.variants, optionMap);
      }

      // Associate with sales channels (store in metadata for now, can be extended with relation table)
      if (input.sales_channels && input.sales_channels.length > 0) {
        await this.associateSalesChannels(trx, product.id, input.sales_channels);
      }

      // Store shipping_profile_id in metadata (can be extended with relation table)
      if (input.shipping_profile_id) {
        await this.associateShippingProfile(trx, product.id, input.shipping_profile_id);
      }

      // Link product to tags
      if (input.tag_ids && input.tag_ids.length > 0) {
        await this.linkProductTags(trx, product.id, input.tag_ids);
      }

      // Link product attributes
      if (input.attributes && input.attributes.length > 0) {
        await this.linkProductAttributes(trx, product.id, input.attributes);
      }

      return product;
    });
  }

  async linkProductAttributes(
    trx: Kysely<Database>,
    productId: string,
    attributes: Array<{ id: string; value: unknown }>
  ) {
    if (attributes.length === 0) return;

    const attributeIds = [...new Set(attributes.map((a) => a.id))];
    const existingAttributes = await trx
      .selectFrom("product_attributes")
      .where("id", "in", attributeIds)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    const existingIds = new Set(existingAttributes.map((a) => a.id));
    for (const id of attributeIds) {
      if (!existingIds.has(id)) {
        throw new ValidationError("Product attribute not found", [{
          type: "not_found",
          message: `Product attribute not found: ${id}`,
          path: "attributes",
        }]);
      }
    }

    const values = attributes.map((a) => ({
      id: randomUUID(),
      attribute_id: a.id,
      product_id: productId,
      value: typeof a.value === "string" ? a.value : JSON.stringify(a.value),
      metadata: null,
      deleted_at: null,
    }));

    await trx
      .insertInto("product_attribute_values")
      .values(values)
      .execute();
  }

  async linkProductTags(trx: Kysely<Database>, productId: string, tagIds: string[]) {
    const relations = tagIds.map((product_tag_id) => ({
      product_id: productId,
      product_tag_id,
    }));
    await trx
      .insertInto("product_tag_relations")
      .values(relations)
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  async validateCategory(trx: Kysely<Database>, input: CreateProductProcessInput) {
    if (!input.category_id) {
      return null;
    }

    const category = await trx
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

  async generateHandle(trx: Kysely<Database>, input: CreateProductProcessInput): Promise<string> {
    if (input.handle) {
      // Check if handle already exists
      const existing = await trx
        .selectFrom("products")
        .where("handle", "=", input.handle)
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

    // Generate handle from title
    const baseHandle = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let handle = baseHandle;
    let counter = 1;

    while (true) {
      const existing = await trx
        .selectFrom("products")
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

  async createProduct(
    trx: Kysely<Database>,
    input: CreateProductProcessInput,
    category: { id: string } | null,
    handle: string
  ) {
    this.logger.info("Creating product", { input });

    return trx
      .insertInto("products")
      .values({
        id: randomUUID(),
        title: input.title,
        handle,
        subtitle: input.subtitle ?? null,
        description: input.description ?? null,
        is_giftcard: input.is_giftcard ?? false,
        discountable: input.discountable ?? true,
        status: input.status ?? "draft",
        thumbnail: input.thumbnail ?? null,
        external_id: input.external_id ?? null,
        category_id: category?.id ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Create product options and option values.
   * Options are global: reuse existing option by title (case-insensitive); do not create duplicate.
   * Option values are per (option + product).
   * Returns a map of option_title -> { option_id, values: { value -> option_value_id } }
   */
  async createProductOptions(
    trx: Kysely<Database>,
    productId: string,
    options: Array<{ title: string; values: string[] }>
  ): Promise<Map<string, { option_id: string; values: Map<string, string> }>> {
    const optionMap = new Map<string, { option_id: string; values: Map<string, string> }>();

    if (options.length === 0) {
      return optionMap;
    }

    // Fetch all options (global); match by title case-insensitive
    const allOptions = await trx
      .selectFrom("product_options")
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const existingByLowerTitle = new Map<string, { id: string; title: string }>();
    for (const opt of allOptions) {
      const key = opt.title.toLowerCase();
      if (!existingByLowerTitle.has(key)) {
        existingByLowerTitle.set(key, { id: opt.id, title: opt.title });
      }
    }

    const optionsToCreate: Array<{ id: string; title: string }> = [];
    const optionIdsToFetch: string[] = [];

    for (const optionInput of options) {
      const key = optionInput.title.toLowerCase();
      const existingOption = existingByLowerTitle.get(key);
      if (existingOption) {
        optionIdsToFetch.push(existingOption.id);
        optionMap.set(optionInput.title, {
          option_id: existingOption.id,
          values: new Map<string, string>(),
        });
      } else {
        const newOptionId = randomUUID();
        optionsToCreate.push({ id: newOptionId, title: optionInput.title });
        optionIdsToFetch.push(newOptionId);
        existingByLowerTitle.set(key, { id: newOptionId, title: optionInput.title });
        optionMap.set(optionInput.title, {
          option_id: newOptionId,
          values: new Map<string, string>(),
        });
      }
    }

    if (optionsToCreate.length > 0) {
      await trx
        .insertInto("product_options")
        .values(
          optionsToCreate.map((opt) => ({
            id: opt.id,
            title: opt.title,
            metadata: null,
          }))
        )
        .execute();
    }

    const optionIdsForProduct = optionMap.size > 0 ? [...optionMap.values()].map((o) => o.option_id) : [];
    if (optionIdsForProduct.length > 0) {
      const existingOptionValues = await trx
        .selectFrom("product_option_values")
        .where("option_id", "in", optionIdsForProduct)
        .where("product_id", "=", productId)
        .where("deleted_at", "is", null)
        .selectAll()
        .execute();

      const existingValuesMap = new Map<string, Map<string, typeof existingOptionValues[0]>>();
      for (const ov of existingOptionValues) {
        const oid = ov.option_id ?? "";
        if (!existingValuesMap.has(oid)) existingValuesMap.set(oid, new Map());
        existingValuesMap.get(oid)!.set(ov.value, ov);
      }

      const optionValuesToCreate: Array<{ id: string; value: string; option_id: string }> = [];

      for (const optionInput of options) {
        const optionData = optionMap.get(optionInput.title);
        if (!optionData) continue;
        const optionValuesMap = existingValuesMap.get(optionData.option_id) ?? new Map();
        const valueMap = new Map<string, string>();

        for (const valueStr of optionInput.values) {
          const existingValue = optionValuesMap.get(valueStr);
          if (existingValue) {
            valueMap.set(valueStr, existingValue.id);
          } else {
            const newValueId = randomUUID();
            optionValuesToCreate.push({
              id: newValueId,
              value: valueStr,
              option_id: optionData.option_id,
            });
            valueMap.set(valueStr, newValueId);
          }
        }
        optionData.values = valueMap;
      }

      if (optionValuesToCreate.length > 0) {
        await trx
          .insertInto("product_option_values")
          .values(
            optionValuesToCreate.map((ov) => ({
              id: ov.id,
              value: ov.value,
              option_id: ov.option_id,
              product_id: productId,
              metadata: null,
            }))
          )
          .execute();
      }
    }

    return optionMap;
  }

  /**
   * Create product variants with option relations and prices
   */
  async createProductVariants(
    trx: Kysely<Database>,
    productId: string,
    variants: Array<{
      title: string;
      sku?: string;
      barcode?: string;
      ean?: string;
      upc?: string;
      allow_backorder?: boolean;
      manage_inventory?: boolean;
      variant_rank?: number;
      thumbnail?: string;
      options?: Record<string, string>; // Record<option_title, option_value>
      prices?: Array<{
        amount: number;
        currency_code: string;
        min_quantity?: number;
        max_quantity?: number;
        price_list_id?: string;
      }>;
      metadata?: Record<string, string | number>;
    }>,
    optionMap: Map<string, { option_id: string; values: Map<string, string> }>
  ) {
    if (variants.length === 0) {
      return;
    }

    // Prepare all variants for bulk insert
    const variantsToCreate = variants.map((variantInput) => ({
      id: randomUUID(),
      title: variantInput.title,
      product_id: productId,
      sku: variantInput.sku ?? null,
      barcode: variantInput.barcode ?? null,
      ean: variantInput.ean ?? null,
      upc: variantInput.upc ?? null,
      allow_backorder: variantInput.allow_backorder ?? false,
      manage_inventory: variantInput.manage_inventory ?? true,
      variant_rank: variantInput.variant_rank ?? null,
      thumbnail: variantInput.thumbnail ?? null,
      metadata: variantInput.metadata ?? null,
    }));

    // Bulk insert all variants
    const createdVariants = await trx
      .insertInto("product_variants")
      .values(variantsToCreate)
      .returningAll()
      .execute();

    // Create a map of variant title -> variant for quick lookup
    const variantMap = new Map<string, typeof createdVariants[0]>();
    for (const variant of createdVariants) {
      variantMap.set(variant.title, variant);
    }

    // Collect all variant-option relations for bulk insert
    const variantOptionRelations: Array<{ variant_id: string; option_value_id: string }> = [];
    const variantPricesMap = new Map<string, Array<{
      amount: number;
      currency_code: string;
      min_quantity?: number;
      max_quantity?: number;
      price_list_id?: string;
    }>>();

    // Process each variant input to collect relations and prices
    for (const variantInput of variants) {
      const variant = variantMap.get(variantInput.title);
      if (!variant) {
        this.logger.warn("Failed to create variant", { variantInput });
        continue;
      }

      // Collect option relations
      if (variantInput.options) {
        for (const [optionTitle, optionValue] of Object.entries(variantInput.options)) {
          const optionData = optionMap.get(optionTitle);
          if (!optionData) {
            throw new ValidationError(`Option not found: ${optionTitle}`, [{
              type: "not_found",
              message: `Option "${optionTitle}" was not defined in product options`,
              path: `variants.options.${optionTitle}`,
            }]);
          }

          const optionValueId = optionData.values.get(optionValue);
          if (!optionValueId) {
            throw new ValidationError(`Option value not found: ${optionValue}`, [{
              type: "not_found",
              message: `Option value "${optionValue}" was not defined for option "${optionTitle}"`,
              path: `variants.options.${optionTitle}`,
            }]);
          }

          variantOptionRelations.push({
            variant_id: variant.id,
            option_value_id: optionValueId,
          });
        }
      }

      // Collect prices
      if (variantInput.prices && variantInput.prices.length > 0) {
        variantPricesMap.set(variant.id, variantInput.prices);
      }
    }

    // Bulk insert variant-option relations
    if (variantOptionRelations.length > 0) {
      await trx
        .insertInto("product_variant_option_relations")
        .values(variantOptionRelations)
        .onConflict((oc) => oc.doNothing())
        .execute();
    }

    // Create prices for all variants (can't bulk insert due to price_set requirement)
    for (const [variantId, prices] of variantPricesMap.entries()) {
      await this.createVariantPrices(trx, variantId, prices);
    }
  }

  /**
   * Create prices for a variant
   * Creates a price_set and associated prices
   */
  async createVariantPrices(
    trx: Kysely<Database>,
    variantId: string,
    prices: Array<{
      amount: number;
      currency_code: string;
      min_quantity?: number;
      max_quantity?: number;
      price_list_id?: string;
    }>
  ) {
    if (prices.length === 0) {
      return;
    }

    // Create price_set for the variant
    // Using type assertion to access pricing tables
    const pricingDb = trx as any;
    const priceSet = await pricingDb
      .insertInto("price_sets")
      .values({
        id: randomUUID(),
        metadata: { variant_id: variantId },
      })
      .returningAll()
      .executeTakeFirst();

    if (!priceSet) {
      throw new Error("Failed to create price_set");
    }

    // Bulk insert prices
    await pricingDb
      .insertInto("prices")
      .values(
        prices.map((priceInput) => ({
          id: randomUUID(),
          price_set_id: priceSet.id,
          amount: priceInput.amount.toString(),
          currency_code: priceInput.currency_code,
          min_quantity: priceInput.min_quantity ?? null,
          max_quantity: priceInput.max_quantity ?? null,
          price_list_id: priceInput.price_list_id ?? null,
          metadata: null,
        }))
      )
      .execute();
  }

  /**
   * Associate product with sales channels
   * For now, stores in metadata. Can be extended with a relation table.
   */
  async associateSalesChannels(
    trx: Kysely<Database>,
    productId: string,
    salesChannels: Array<{ id: string }>
  ) {
    const product = await trx
      .selectFrom("products")
      .where("id", "=", productId)
      .selectAll()
      .executeTakeFirst();

    if (product) {
      const metadata = (product.metadata as Record<string, unknown>) || {};
      metadata.sales_channels = salesChannels.map((sc) => sc.id);

      await trx
        .updateTable("products")
        .set({ metadata })
        .where("id", "=", productId)
        .execute();
    }
  }

  /**
   * Associate product with shipping profile
   * For now, stores in metadata. Can be extended with a relation table.
   */
  async associateShippingProfile(
    trx: Kysely<Database>,
    productId: string,
    shippingProfileId: string
  ) {
    const product = await trx
      .selectFrom("products")
      .where("id", "=", productId)
      .selectAll()
      .executeTakeFirst();

    if (product) {
      const metadata = (product.metadata as Record<string, unknown>) || {};
      metadata.shipping_profile_id = shippingProfileId;

      await trx
        .updateTable("products")
        .set({ metadata })
        .where("id", "=", productId)
        .execute();
    }
  }
}
