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
import { type CreateProductProcessInput, type CreateProductProcessOutput, CreateProductSchema } from "./create-product.schema";
import type { Database, Product } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_PROCESS = Symbol("CreateProduct");

@Process(CREATE_PRODUCT_PROCESS)
export class CreateProductProcess
  implements ProcessContract<typeof CreateProductSchema,  CreateProductProcessOutput> {

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

      // ── Validate category ──────────────────────────────────────────────
      // Ensure the referenced category exists before attaching it to the product
      let category: { id: string } | null = null;
      if (input.category_id) {
        const foundCategory = await trx
          .selectFrom("product_categories")
          .where("id", "=", input.category_id)
          .where("deleted_at", "is", null)
          .selectAll()
          .executeTakeFirst();

        if (!foundCategory) {
          throw new ValidationError("Category not found", [{
            type: "not_found",
            message: "Category not found",
            path: "category_id",
          }]);
        }
        category = foundCategory;
      }

      // ── Generate handle ────────────────────────────────────────────────
      // Use the explicit handle (must be unique) or derive one from the title with a dedup suffix
      let handle: string;
      if (input.handle) {
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
        handle = input.handle;
      } else {
        const baseHandle = input.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        handle = baseHandle;
        let counter = 1;

        while (true) {
          const existing = await trx
            .selectFrom("products")
            .where("handle", "=", handle)
            .where("deleted_at", "is", null)
            .select("id")
            .executeTakeFirst();

          if (!existing) break;
          handle = `${baseHandle}-${counter}`;
          counter++;
        }
      }

      // ── Insert the product record ──────────────────────────────────────
      this.logger.info("Creating product", { input });

      const product = await trx
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
          attribute_group_id: input.attribute_group_id ?? null,
          metadata: input.metadata ?? null,
        })
        .returningAll()
        .executeTakeFirst();

      if (!product) {
        return product;
      }

      // ── Create product options & option values ─────────────────────────
      // Options are global: reuse existing option by title (case-insensitive).
      // Option values are scoped to (option + product).
      // Returns a map of option_title -> { option_id, values: { value -> option_value_id } }
      const optionMap = new Map<string, { option_id: string; values: Map<string, string> }>();
      const inputOptions = input.options || [];

      if (inputOptions.length > 0) {
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

        for (const optionInput of inputOptions) {
          const key = optionInput.title.toLowerCase();
          const existingOption = existingByLowerTitle.get(key);
          if (existingOption) {
            optionMap.set(optionInput.title, {
              option_id: existingOption.id,
              values: new Map<string, string>(),
            });
          } else {
            const newOptionId = randomUUID();
            optionsToCreate.push({ id: newOptionId, title: optionInput.title });
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

        // Resolve or create option values for each option
        const optionIdsForProduct = [...optionMap.values()].map((o) => o.option_id);
        if (optionIdsForProduct.length > 0) {
          const existingOptionValues = await trx
            .selectFrom("product_option_values")
            .where("option_id", "in", optionIdsForProduct)
            .where("product_id", "=", product.id)
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

          for (const optionInput of inputOptions) {
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
                  product_id: product.id,
                  metadata: null,
                }))
              )
              .execute();
          }
        }
      }

      // ── Create product variants with option relations and prices ───────
      if (input.variants && input.variants.length > 0) {
        const variantsToCreate = input.variants.map((variantInput) => ({
          id: randomUUID(),
          title: variantInput.title,
          product_id: product.id,
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

        const createdVariants = await trx
          .insertInto("product_variants")
          .values(variantsToCreate)
          .returningAll()
          .execute();

        const variantMap = new Map<string, typeof createdVariants[0]>();
        for (const variant of createdVariants) {
          variantMap.set(variant.title, variant);
        }

        // Collect all variant-option relations and prices for bulk processing
        const variantOptionRelations: Array<{ variant_id: string; option_value_id: string }> = [];
        const variantPricesMap = new Map<string, Array<{
          amount: number;
          currency_code: string;
          min_quantity?: number;
          max_quantity?: number;
          price_list_id?: string;
        }>>();

        for (const variantInput of input.variants) {
          const variant = variantMap.get(variantInput.title);
          if (!variant) {
            this.logger.warn("Failed to create variant", { variantInput });
            continue;
          }

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

          if (variantInput.prices && variantInput.prices.length > 0) {
            variantPricesMap.set(variant.id, variantInput.prices);
          }
        }

        if (variantOptionRelations.length > 0) {
          await trx
            .insertInto("product_variant_option_relations")
            .values(variantOptionRelations)
            .onConflict((oc) => oc.doNothing())
            .execute();
        }

        // Create a price_set per variant, then bulk-insert its prices
        const pricingDb = trx as any;
        for (const [variantId, prices] of variantPricesMap.entries()) {
          if (prices.length === 0) continue;

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
      }

      // ── Associate with sales channels ──────────────────────────────────
      if (input.sales_channel_ids && input.sales_channel_ids.length > 0) {
        const scRelations = input.sales_channel_ids.map((id) => ({
          id: randomUUID(),
          product_id: product.id,
          sales_channel_id: id,
        }));

        await trx
          .insertInto("product_sales_channels")
          .values(scRelations)
          .onConflict((oc) => oc.doNothing())
          .execute();
      }

      // ── Associate with shipping profile (stored in product metadata) ───
      if (input.shipping_profile_id) {
        const currentProduct = await trx
          .selectFrom("products")
          .where("id", "=", product.id)
          .selectAll()
          .executeTakeFirst();

        if (currentProduct) {
          const metadata = (currentProduct.metadata as Record<string, unknown>) || {};
          metadata.shipping_profile_id = input.shipping_profile_id;

          await trx
            .updateTable("products")
            .set({ metadata })
            .where("id", "=", product.id)
            .execute();
        }
      }

      // ── Link product to tags ───────────────────────────────────────────
      if (input.tag_ids && input.tag_ids.length > 0) {
        await trx
          .insertInto("product_tag_relations")
          .values(
            input.tag_ids.map((product_tag_id) => ({
              product_id: product.id,
              product_tag_id,
            }))
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
      }

      // ── Link product to attribute groups ───────────────────────────────
      // Use the explicit list or derive from the attributes' group ids
      const groupsToLink = input.attribute_groups && input.attribute_groups.length > 0
        ? input.attribute_groups
        : (input.attributes && input.attributes.length > 0
          ? [...new Set(input.attributes.map((a) => a.attribute_group_id))].map((attribute_group_id) => ({ attribute_group_id, required: false, rank: 0 }))
          : []);

      if (groupsToLink.length > 0) {
        const groupIds = [...new Set(groupsToLink.map((g) => g.attribute_group_id))];
        const existingGroups = await trx
          .selectFrom("product_attribute_groups")
          .where("id", "in", groupIds)
          .where("deleted_at", "is", null)
          .select("id")
          .execute();
        const foundGroupIds = new Set(existingGroups.map((r) => r.id));
        const missingGroups = groupIds.filter((id) => !foundGroupIds.has(id));
        if (missingGroups.length > 0) {
          throw new ValidationError("Product attribute group not found", [{
            type: "not_found",
            message: `Product attribute groups not found: ${missingGroups.join(", ")}`,
            path: "attribute_groups",
          }]);
        }

        await trx
          .insertInto("product_attribute_group_relations")
          .values(
            groupsToLink.map((g, i) => ({
              id: randomUUID(),
              product_id: product.id,
              attribute_group_id: g.attribute_group_id,
              required: g.required ?? false,
              rank: g.rank ?? i,
            }))
          )
          .execute();
      }

      // ── Link product attribute values (group-scoped) ───────────────────
      if (input.attributes && input.attributes.length > 0) {
        const linkedGroupIds = new Set(groupsToLink.map((g) => g.attribute_group_id));

        // Every attribute must belong to a group that was just linked
        for (const a of input.attributes) {
          if (!linkedGroupIds.has(a.attribute_group_id)) {
            throw new ValidationError("Product must be linked to attribute group before setting attribute values", [{
              type: "invalid",
              message: `Attribute group ${a.attribute_group_id} not in product's attribute_groups`,
              path: "attributes",
            }]);
          }
        }

        // Verify each (group, attribute) pair is registered in the group's attribute list
        const existingInGroup = await trx
          .selectFrom("product_attribute_group_attributes")
          .select(["attribute_group_id", "attribute_id"])
          .execute();
        const validPairSet = new Set(existingInGroup.map((r) => `${r.attribute_group_id}:${r.attribute_id}`));
        for (const a of input.attributes) {
          if (!validPairSet.has(`${a.attribute_group_id}:${a.attribute_id}`)) {
            throw new ValidationError("Attribute not assigned to group", [{
              type: "invalid",
              message: `Attribute ${a.attribute_id} is not assigned to group ${a.attribute_group_id}`,
              path: "attributes",
            }]);
          }
        }

        // Verify the attribute records themselves exist
        const existingAttrs = await trx
          .selectFrom("product_attributes")
          .where("id", "in", [...new Set(input.attributes.map((a) => a.attribute_id))])
          .where("deleted_at", "is", null)
          .select("id")
          .execute();
        const attrIds = new Set(existingAttrs.map((r) => r.id));
        for (const a of input.attributes) {
          if (!attrIds.has(a.attribute_id)) {
            throw new ValidationError("Product attribute not found", [{
              type: "not_found",
              message: `Product attribute not found: ${a.attribute_id}`,
              path: "attributes",
            }]);
          }
        }

        await trx
          .insertInto("product_attribute_values")
          .values(
            input.attributes.map((a) => ({
              id: randomUUID(),
              attribute_group_id: a.attribute_group_id,
              attribute_id: a.attribute_id,
              product_id: product.id,
              value: typeof a.value === "string" ? a.value : JSON.stringify(a.value),
              metadata: null,
              deleted_at: null,
            }))
          )
          .execute();
      }

      return product;
    });
  }
}
