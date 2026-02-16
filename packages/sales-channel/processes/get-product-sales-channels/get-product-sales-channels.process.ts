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
  type GetProductSalesChannelsProcessInput,
  GetProductSalesChannelsSchema,
} from "./get-product-sales-channels.schema";
import type { Database, SalesChannel } from "../../db/type";

export const GET_PRODUCT_SALES_CHANNELS_PROCESS = Symbol(
  "GetProductSalesChannels"
);

@Process(GET_PRODUCT_SALES_CHANNELS_PROCESS)
export class GetProductSalesChannelsProcess
  implements ProcessContract<SalesChannel[]>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: GetProductSalesChannelsSchema,
    })
    context: ProcessContextType<typeof GetProductSalesChannelsSchema>
  ) {
    const { input } = context;
    return this.getProductSalesChannels(input.product_id);
  }

  async getProductSalesChannels(productId: string): Promise<SalesChannel[]> {
    this.logger.info("Getting product sales channels", { productId });

    const salesChannels = await this.db
      .selectFrom("product_sales_channels")
      .innerJoin(
        "sales_channels",
        "sales_channels.id",
        "product_sales_channels.sales_channel_id"
      )
      .where("product_sales_channels.product_id", "=", productId)
      .where("sales_channels.deleted_at", "is", null)
      .selectAll("sales_channels")
      .execute();

    return salesChannels;
  }
}
