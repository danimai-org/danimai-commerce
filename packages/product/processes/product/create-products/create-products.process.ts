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
import { type CreateProductsProcessInput, CreateProductsSchema } from "./create-products.schema";
import type { Database, Product } from "../../../db/type";
import { type CreateProductProcessInput } from "../create-product/create-product.schema";
import { randomUUID } from "crypto";

export const CREATE_PRODUCTS_PROCESS = Symbol("CreateProducts");

@Process(CREATE_PRODUCTS_PROCESS)
export class CreateProductsProcess
  implements ProcessContract<Product[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductsSchema,
  }) context: ProcessContextType<typeof CreateProductsSchema>) {
    const { input } = context;

    if (input.products.length === 0) {
      return [];
    }

    // Bulk validate all categories
    const categoryIds = [...new Set(input.products.map((p) => p.category_id).filter((id): id is string => id !== undefined && id !== null))];
    const categoriesMap = await this.bulkValidateCategories(categoryIds);

    // Bulk generate handles (check existing handles first)
    const handlesMap = await this.bulkGenerateHandles(input.products);

    // Create all products
    const productsToCreate = input.products.map((productInput, index) => ({
      id: randomUUID(),
      title: productInput.title,
      handle: handlesMap.get(index)!,
      subtitle: productInput.subtitle ?? null,
      description: productInput.description ?? null,
      is_giftcard: productInput.is_giftcard ?? false,
      discountable: productInput.discountable ?? true,
      status: productInput.status ?? "draft",
      thumbnail: productInput.thumbnail ?? null,
      external_id: productInput.external_id ?? null,
      category_id: productInput.category_id ? categoriesMap.get(productInput.category_id)?.id ?? null : null,
      metadata: productInput.metadata ?? null,
    }));

    const createdProducts = await this.db
      .insertInto("products")
      .values(productsToCreate)
      .returningAll()
      .execute();

    // Process each product's options, variants, and associations
    const metadataUpdates: Array<{ productId: string; metadata: Record<string, unknown> }> = [];

    for (let i = 0; i < input.products.length; i++) {
      const productInput = input.products[i];
      const product = createdProducts[i];

      if (!productInput || !product) {
        continue;
      }

      // Create product options and option values
      const optionMap = await this.createProductOptions(product.id, productInput.options || []);

      // Create product variants with options and prices
      if (productInput.variants && productInput.variants.length > 0) {
        await this.createProductVariants(product.id, productInput.variants, optionMap);
      }

      // Associate with sales channels
      if (productInput.sales_channels && productInput.sales_channels.length > 0) {
        await this.associateSalesChannels(product.id, productInput.sales_channels);
      }

      // Collect metadata updates for bulk update
      const metadata: Record<string, unknown> = { ...((product.metadata as Record<string, unknown>) || {}) };

      if (productInput.shipping_profile_id) {
        metadata.shipping_profile_id = productInput.shipping_profile_id;
      }

      if (Object.keys(metadata).length > 0) {
        metadataUpdates.push({ productId: product.id, metadata });
      }
    }

    // Bulk update metadata
    if (metadataUpdates.length > 0) {
      // Note: Kysely doesn't support bulk updates with different values per row
      // So we still need to update individually, but we can batch them
      for (const update of metadataUpdates) {
        await this.db
          .updateTable("products")
          .set({ metadata: update.metadata })
          .where("id", "=", update.productId)
          .execute();
      }
    }

    return createdProducts;
  }

  async validateCategory(input: CreateProductProcessInput) {
    if (!input.category_id) {
      return null;
    }

    const category = await this.db
      .selectFrom("product_categories")
      .where("id", "=", input.category_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    return category;
  }

  async bulkValidateCategories(categoryIds: string[]): Promise<Map<string, { id: string }>> {
    if (categoryIds.length === 0) {
      return new Map();
    }

    const categories = await this.db
      .selectFrom("product_categories")
      .where("id", "in", categoryIds)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const categoriesMap = new Map<string, { id: string }>();
    for (const category of categories) {
      categoriesMap.set(category.id, category);
    }

    return categoriesMap;
  }

  async bulkGenerateHandles(products: CreateProductProcessInput[]): Promise<Map<number, string>> {
    const handlesMap = new Map<number, string>();

    // Collect all handles that need to be checked
    const handlesToCheck: Array<{ index: number; handle: string | undefined; title: string }> = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (product === undefined) continue;
      handlesToCheck.push({
        index: i,
        handle: product.handle,
        title: product.title,
      });
    }

    // Check existing handles in bulk
    const providedHandles = handlesToCheck
      .map((h) => h.handle)
      .filter((h): h is string => h !== undefined && h !== null);

    const existingHandles = providedHandles.length > 0
      ? await this.db
        .selectFrom("products")
        .where("handle", "in", providedHandles)
        .where("deleted_at", "is", null)
        .select("handle")
        .execute()
      : [];

    const existingHandlesSet = new Set(existingHandles.map((h) => h.handle));

    // Generate handles
    for (const handleInfo of handlesToCheck) {
      let handle: string;

      if (handleInfo.handle) {
        if (existingHandlesSet.has(handleInfo.handle)) {
          // Generate unique handle
          const baseHandle = handleInfo.handle;
          let uniqueHandle = `${baseHandle}-${Date.now()}`;
          let counter = 1;

          while (true) {
            const exists = await this.db
              .selectFrom("products")
              .where("handle", "=", uniqueHandle)
              .where("deleted_at", "is", null)
              .select("id")
              .executeTakeFirst();

            if (!exists) {
              break;
            }

            uniqueHandle = `${baseHandle}-${Date.now()}-${counter}`;
            counter++;
          }

          handle = uniqueHandle;
        } else {
          handle = handleInfo.handle;
        }
      } else {
        // Generate handle from title
        const baseHandle = handleInfo.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        let uniqueHandle = baseHandle;
        let counter = 1;

        while (true) {
          const exists = await this.db
            .selectFrom("products")
            .where("handle", "=", uniqueHandle)
            .where("deleted_at", "is", null)
            .select("id")
            .executeTakeFirst();

          if (!exists) {
            break;
          }

          uniqueHandle = `${baseHandle}-${counter}`;
          counter++;
        }

        handle = uniqueHandle;
      }

      handlesMap.set(handleInfo.index, handle);
    }

    return handlesMap;
  }

  async generateHandle(input: CreateProductProcessInput): Promise<string> {
    if (input.handle) {
      const existing = await this.db
        .selectFrom("products")
        .where("handle", "=", input.handle)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (existing) {
        // Generate unique handle
        const baseHandle = input.handle;
        let handle = `${baseHandle}-${Date.now()}`;
        let counter = 1;

        while (true) {
          const existing = await this.db
            .selectFrom("products")
            .where("handle", "=", handle)
            .where("deleted_at", "is", null)
            .select("id")
            .executeTakeFirst();

          if (!existing) {
            break;
          }

          handle = `${baseHandle}-${Date.now()}-${counter}`;
          counter++;
        }

        return handle;
      }

      return input.handle;
    }

    const baseHandle = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let handle = baseHandle;
    let counter = 1;

    while (true) {
      const existing = await this.db
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
    input: CreateProductProcessInput,
    category: { id: string } | null,
    handle: string
  ) {
    this.logger.info("Creating product", { input });

    return this.db
      .insertInto("products")
      .values({
        id: sql`gen_random_uuid()`,
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
   * Create product options and option values
   * Returns a map of option_title -> { option_id, values: { value -> option_value_id } }
   */
  async createProductOptions(
    productId: string,
    options: Array<{ title: string; values: string[] }>
  ): Promise<Map<string, { option_id: string; values: Map<string, string> }>> {
    const optionMap = new Map<string, { option_id: string; values: Map<string, string> }>();

    if (options.length === 0) {
      return optionMap;
    }

    // Options are global: match by title case-insensitive
    const allOptions = await this.db
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
      await this.db
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
      const existingOptionValues = await this.db
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
        await this.db
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
    const createdVariants = await this.db
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
      await this.db
        .insertInto("product_variant_option_relations")
        .values(variantOptionRelations)
        .onConflict((oc) => oc.doNothing())
        .execute();
    }

    // Create prices for all variants - bulk create price_sets first, then bulk insert prices
    if (variantPricesMap.size > 0) {
      await this.bulkCreateVariantPrices(variantPricesMap);
    }
  }

  /**
   * Bulk create prices for multiple variants
   * Creates price_sets in bulk, then bulk inserts all prices
   */
  async bulkCreateVariantPrices(
    variantPricesMap: Map<string, Array<{
      amount: number;
      currency_code: string;
      min_quantity?: number;
      max_quantity?: number;
      price_list_id?: string;
    }>>
  ) {
    if (variantPricesMap.size === 0) {
      return;
    }

    const pricingDb = this.db as any;

    // Bulk create all price_sets
    const priceSetsToCreate = Array.from(variantPricesMap.keys()).map((variantId) => ({
      id: randomUUID(),
      metadata: { variant_id: variantId },
    }));

    const createdPriceSets = await pricingDb
      .insertInto("price_sets")
      .values(priceSetsToCreate)
      .returningAll()
      .execute();

    // Create a map of variant_id -> price_set_id
    const priceSetMap = new Map<string, string>();
    const variantIds = Array.from(variantPricesMap.keys());
    for (let i = 0; i < createdPriceSets.length; i++) {
      const variantId = variantIds[i];
      const row = createdPriceSets[i];
      if (variantId !== undefined && row) {
        priceSetMap.set(variantId, row.id);
      }
    }

    // Collect all prices for bulk insert
    const allPrices: Array<{
      id: string;
      price_set_id: string;
      amount: string;
      currency_code: string;
      min_quantity: number | null;
      max_quantity: number | null;
      price_list_id: string | null;
      metadata: null;
    }> = [];

    for (const [variantId, prices] of variantPricesMap.entries()) {
      const priceSetId = priceSetMap.get(variantId);
      if (!priceSetId) {
        this.logger.warn("Price set not found for variant", { variantId });
        continue;
      }

      for (const priceInput of prices) {
        allPrices.push({
          id: randomUUID(),
          price_set_id: priceSetId,
          amount: priceInput.amount.toString(),
          currency_code: priceInput.currency_code,
          min_quantity: priceInput.min_quantity ?? null,
          max_quantity: priceInput.max_quantity ?? null,
          price_list_id: priceInput.price_list_id ?? null,
          metadata: null,
        });
      }
    }

    // Bulk insert all prices
    if (allPrices.length > 0) {
      await pricingDb
        .insertInto("prices")
        .values(allPrices)
        .execute();
    }
  }

  /**
   * Create prices for a variant
   * Creates a price_set and associated prices
   */
  async createVariantPrices(
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
    const pricingDb = this.db as any;
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
   * Uses product_sales_channels junction table
   */
  async associateSalesChannels(
    productId: string,
    salesChannels: Array<{ id: string }>
  ) {
    if (salesChannels.length === 0) return;

    const relations = salesChannels.map((sc) => ({
      id: randomUUID(),
      product_id: productId,
      sales_channel_id: sc.id,
    }));

    await this.db
      .insertInto("product_sales_channels")
      .values(relations)
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /**
   * Associate product with shipping profile
   * For now, stores in metadata. Can be extended with a relation table.
   */
  async associateShippingProfile(
    productId: string,
    shippingProfileId: string
  ) {
    const product = await this.db
      .selectFrom("products")
      .where("id", "=", productId)
      .selectAll()
      .executeTakeFirst();

    if (product) {
      const metadata = (product.metadata as Record<string, unknown>) || {};
      metadata.shipping_profile_id = shippingProfileId;

      await this.db
        .updateTable("products")
        .set({ metadata })
        .where("id", "=", productId)
        .execute();
    }
  }
}
