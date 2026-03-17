import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { type ColumnType, Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { randomUUID } from "crypto";
import {
  type UpdateSalesChannelProductsProcessOutput,
  UpdateSalesChannelProductsSchema,
} from "./update-sales-channel-product.schema";
import type { Database } from "../../db/type";

type ProductLookupTable = {
  id: string;
  deleted_at: ColumnType<Date | null, never, never>;
};

type UpdateSalesChannelProductsDatabase = Database & {
  products: ProductLookupTable;
};
export const UPDATE_SALES_CHANNEL_PRODUCTS_PROCESS = Symbol(
  "UpdateSalesChannelProducts"
);

@Process(UPDATE_SALES_CHANNEL_PRODUCTS_PROCESS)
export class UpdateSalesChannelProductsProcess
  implements ProcessContract<
    typeof UpdateSalesChannelProductsSchema,
    UpdateSalesChannelProductsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<UpdateSalesChannelProductsDatabase>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: UpdateSalesChannelProductsSchema,
    })
    context: ProcessContextType<typeof UpdateSalesChannelProductsSchema>
  ) {
    const { input } = context;
    const salesChannel = await this.db
      .selectFrom("sales_channels")
      .where("id", "in", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (salesChannel.length !== input.id.length) {
      throw new NotFoundError("Sales channels not found");
    }

    const uniqueProductIds = new Set([
      ...input.product.add,
      ...input.product.remove,
    ]);

    const products = await this.db
      .selectFrom("products")
      .where("id", "in", Array.from(uniqueProductIds))
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (products.length !== uniqueProductIds.size) {
      throw new NotFoundError("Products not found");
    }

    if (input.product.add.length > 0) {
      const relations = input.id.flatMap((salesChannelId) =>
        input.product.add.map((productId) => ({
          id: randomUUID(),
          product_id: productId,
          sales_channel_id: salesChannelId,
        }))
      );

      await this.db
        .insertInto("product_sales_channels")
        .values(relations)
        .onConflict((oc) =>
          oc.columns(["product_id", "sales_channel_id"]).doNothing()
        )
        .execute();
    }

    await this.db
      .deleteFrom("product_sales_channels")
      .where("product_id", "in", input.product.remove)
      .where("sales_channel_id", "in", input.id)
      .execute();
  }
}
