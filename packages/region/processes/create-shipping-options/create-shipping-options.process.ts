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
  type CreateShippingOptionProcessInput,
  CreateShippingOptionsSchema,
} from "./create-shipping-options.schema";
import type { Database as RegionDatabase } from "@danimai/region/db";
import type {
  Database as FulfillmentDatabase,
  ShippingOption,
  NewShippingOption,
} from "@danimai/fulfillment";
import { randomUUID } from "crypto";

type RegionWithFulfillmentDB = RegionDatabase & FulfillmentDatabase;

export const CREATE_SHIPPING_OPTIONS_PROCESS = Symbol("CreateShippingOptions");

@Process(CREATE_SHIPPING_OPTIONS_PROCESS)
export class CreateShippingOptionsProcess
  implements ProcessContract<ShippingOption[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<RegionWithFulfillmentDB>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: CreateShippingOptionsSchema,
    })
    context: ProcessContextType<typeof CreateShippingOptionsSchema>
  ) {
    const { input } = context;

    const created: ShippingOption[] = [];
    for (const opt of input.shipping_options) {
      const so = await this.createShippingOption(opt);
      if (so) created.push(so);
    }
    return created;
  }

  async createShippingOption(input: CreateShippingOptionProcessInput) {
    this.logger.info("Creating shipping option", { input });

    return this.db
      .insertInto("shipping_options")
      .values({
        id: randomUUID(),
        name: input.name,
        service_zone_id: input.service_zone_id,
        shipping_profile_id: input.shipping_profile_id,
        shipping_option_type_id: input.shipping_option_type_id,
        provider_id: input.provider_id,
        price_type: input.price_type,
        amount: input.amount ?? null,
        data: input.data ?? null,
        metadata: input.metadata ?? null,
      } as NewShippingOption)
      .returningAll()
      .executeTakeFirst();
  }
}
