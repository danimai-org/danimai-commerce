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
import {
  type UpdateStockLocationProcessInput,
  UpdateStockLocationSchema,
} from "./update-stock-locations.schema";
import type { Database, StockLocation } from "@danimai/stock-location/db";

export const UPDATE_STOCK_LOCATIONS_PROCESS = Symbol("UpdateStockLocations");

@Process(UPDATE_STOCK_LOCATIONS_PROCESS)
export class UpdateStockLocationsProcess implements ProcessContract<
  StockLocation | undefined
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdateStockLocationSchema })
    context: ProcessContextType<typeof UpdateStockLocationSchema>,
  ) {
    const { input } = context;
    await this.validateStockLocation(input);
    return this.updateStockLocation(input);
  }

  async validateStockLocation(input: UpdateStockLocationProcessInput) {
    const row = await this.db
      .selectFrom("stock_locations")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Stock location not found", [
        { type: "not_found", message: "Stock location not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateStockLocation(input: UpdateStockLocationProcessInput) {
    this.logger.info("Updating stock location", { input });
    let addressId: string | null =
      input.address_id !== undefined ? input.address_id : undefined;

    if (
      input.address &&
      Object.values(input.address).some((v) => v != null && v !== "")
    ) {
      const addr = input.address;
      const existing = await this.db
        .selectFrom("stock_locations")
        .where("id", "=", input.id)
        .where("deleted_at", "is", null)
        .select("address_id")
        .executeTakeFirst();

      const addressPayload = {
        address_1: addr.address_1 ?? null,
        address_2: addr.address_2 ?? null,
        company: addr.company ?? null,
        city: addr.city ?? null,
        province: addr.province ?? null,
        postal_code: addr.postal_code ?? null,
        country_code: addr.country_code ?? null,
        phone: addr.phone ?? null,
      };

      if (existing?.address_id) {
        await this.db
          .updateTable("stock_location_addresses")
          .set({ ...addressPayload, updated_at: sql`now()` })
          .where("id", "=", existing.address_id)
          .execute();
        addressId = existing.address_id;
      } else {
        const inserted = await this.db
          .insertInto("stock_location_addresses")
          .values({
            stock_location_id: input.id,
            ...addressPayload,
            metadata: null,
          })
          .returningAll()
          .executeTakeFirst();
        if (inserted) addressId = inserted.id;
      }
    }

    const updateData: {
      name?: string | null;
      address_id?: string | null;
      metadata?: unknown;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (addressId !== undefined) updateData.address_id = addressId;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    return this.db
      .updateTable("stock_locations")
      .set({ ...updateData, updated_at: sql`now()` })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
