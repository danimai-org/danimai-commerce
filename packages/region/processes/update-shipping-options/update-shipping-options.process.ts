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
import {
  type UpdateShippingOptionProcessInput,
  UpdateShippingOptionSchema,
} from "./update-shipping-options.schema";
import type { Database as RegionDatabase } from "@danimai/region/db";
import type {
  Database as FulfillmentDatabase,
  ShippingOption,
} from "@danimai/fulfillment";

type RegionWithFulfillmentDB = RegionDatabase & FulfillmentDatabase;

export const UPDATE_SHIPPING_OPTIONS_PROCESS = Symbol("UpdateShippingOptions");

@Process(UPDATE_SHIPPING_OPTIONS_PROCESS)
export class UpdateShippingOptionsProcess
  implements ProcessContract<ShippingOption | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<RegionWithFulfillmentDB>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: UpdateShippingOptionSchema,
    })
    context: ProcessContextType<typeof UpdateShippingOptionSchema>
  ) {
    const { input } = context;

    await this.validateShippingOption(input);
    return this.updateShippingOption(input);
  }

  async validateShippingOption(input: UpdateShippingOptionProcessInput) {
    const option = await this.db
      .selectFrom("shipping_options")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!option) {
      throw new ValidationError("Shipping option not found", [
        {
          type: "not_found",
          message: "Shipping option not found",
          path: "id",
        },
      ]);
    }

    return option;
  }

  async updateShippingOption(input: UpdateShippingOptionProcessInput) {
    this.logger.info("Updating shipping option", { input });

    const updateData: {
      name?: string;
      service_zone_id?: string;
      shipping_profile_id?: string;
      shipping_option_type_id?: string;
      provider_id?: string;
      price_type?: "flat" | "calculated";
      amount?: string;
      data?: unknown;
      metadata?: unknown;
    } = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.service_zone_id !== undefined)
      updateData.service_zone_id = input.service_zone_id;
    if (input.shipping_profile_id !== undefined)
      updateData.shipping_profile_id = input.shipping_profile_id;
    if (input.shipping_option_type_id !== undefined)
      updateData.shipping_option_type_id = input.shipping_option_type_id;
    if (input.provider_id !== undefined) updateData.provider_id = input.provider_id;
    if (input.price_type !== undefined) updateData.price_type = input.price_type;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.data !== undefined) updateData.data = input.data;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const row = await this.db
      .updateTable("shipping_options")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
    return row as ShippingOption | undefined;
  }
}
