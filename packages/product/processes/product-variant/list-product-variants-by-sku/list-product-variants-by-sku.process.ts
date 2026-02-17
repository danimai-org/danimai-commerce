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
import {
  type ListProductVariantsBySkuProcessInput,
  ListProductVariantsBySkuSchema,
} from "./list-product-variants-by-sku.schema";
import type { Database, ProductVariant } from "../../../db/type";

export type ProductSummary = {
  id: string;
  title: string | null;
  thumbnail: string | null;
};

export type ListProductVariantsBySkuResult = {
  variants: ProductVariant[];
  product_summaries: Record<string, ProductSummary>;
};

export const LIST_PRODUCT_VARIANTS_BY_SKU_PROCESS = Symbol(
  "ListProductVariantsBySku"
);

@Process(LIST_PRODUCT_VARIANTS_BY_SKU_PROCESS)
export class ListProductVariantsBySkuProcess
  implements ProcessContract<ListProductVariantsBySkuResult>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: ListProductVariantsBySkuSchema })
    context: ProcessContextType<typeof ListProductVariantsBySkuSchema>
  ): Promise<ListProductVariantsBySkuResult> {
    const { input } = context;

    const variants = await this.db
      .selectFrom("product_variants")
      .where("sku", "=", input.sku)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const product_summaries: Record<string, ProductSummary> = {};
    const productIds = [
      ...new Set(
        variants.map((v) => v.product_id).filter((id): id is string => id != null)
      ),
    ];
    if (productIds.length > 0) {
      const products = await this.db
        .selectFrom("products")
        .where("id", "in", productIds)
        .where("deleted_at", "is", null)
        .select(["id", "title", "thumbnail"])
        .execute();
      for (const p of products) {
        product_summaries[p.id] = {
          id: p.id,
          title: p.title ?? null,
          thumbnail: p.thumbnail ?? null,
        };
      }
    }
    return { variants, product_summaries };
  }
}
