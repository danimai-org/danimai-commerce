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
import {
  type SyncProductSalesChannelsProcessInput,
  SyncProductSalesChannelsSchema,
} from "./sync-product-sales-channels.schema";
import type { Database } from "../../db/type";

export const SYNC_PRODUCT_SALES_CHANNELS_PROCESS = Symbol(
  "SyncProductSalesChannels"
);

@Process(SYNC_PRODUCT_SALES_CHANNELS_PROCESS)
export class SyncProductSalesChannelsProcess
  implements ProcessContract<void>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: SyncProductSalesChannelsSchema,
    })
    context: ProcessContextType<typeof SyncProductSalesChannelsSchema>
  ) {
    const { input } = context;
    await this.validateProduct(input.product_id);
    await this.validateSalesChannels(input.sales_channel_ids);
    await this.syncProductSalesChannels(input.product_id, input.sales_channel_ids);
  }

  async validateProduct(productId: string) {
    const product = await this.db
      .selectFrom("products")
      .where("id", "=", productId)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!product) {
      throw new ValidationError("Product not found", [
        {
          type: "not_found",
          message: "Product not found",
          path: "product_id",
        },
      ]);
    }
  }

  async validateSalesChannels(salesChannelIds: string[]) {
    if (salesChannelIds.length === 0) return;

    const existing = await this.db
      .selectFrom("sales_channels")
      .where("id", "in", salesChannelIds)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    const found = new Set(existing.map((r) => r.id));
    const missing = salesChannelIds.filter((id) => !found.has(id));

    if (missing.length > 0) {
      throw new ValidationError("One or more sales channels not found", [
        {
          type: "not_found",
          message: `Sales channels not found: ${missing.join(", ")}`,
          path: "sales_channel_ids",
        },
      ]);
    }
  }

  async syncProductSalesChannels(
    productId: string,
    salesChannelIds: string[]
  ) {
    this.logger.info("Syncing product sales channels", {
      productId,
      salesChannelIds,
    });

    // Delete existing relationships
    await this.db
      .deleteFrom("product_sales_channels")
      .where("product_id", "=", productId)
      .execute();

    // Insert new relationships
    if (salesChannelIds.length > 0) {
      const relations = salesChannelIds.map((sales_channel_id) => ({
        id: randomUUID(),
        product_id: productId,
        sales_channel_id,
      }));

      await this.db
        .insertInto("product_sales_channels")
        .values(relations)
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }
}
