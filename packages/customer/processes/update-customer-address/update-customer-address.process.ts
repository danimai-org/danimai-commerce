import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  UpdateCustomerAddressSchema,
  type UpdateCustomerAddressProcessInput,
} from "./update-customer-address.schema";
import type { Database, CustomerAddress } from "../../db/type";

export const UPDATE_CUSTOMER_ADDRESS_PROCESS = Symbol("UpdateCustomerAddress");

@Process(UPDATE_CUSTOMER_ADDRESS_PROCESS)
export class UpdateCustomerAddressProcess
  implements ProcessContract<CustomerAddress | undefined>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: UpdateCustomerAddressSchema,
    })
    context: ProcessContextType<typeof UpdateCustomerAddressSchema>
  ) {
    const { input } = context;
    return this.updateAddress(input);
  }

  async updateAddress(input: UpdateCustomerAddressProcessInput) {
    this.logger.info("Updating customer address", {
      id: input.id,
      customer_id: input.customer_id,
    });

    const existing = await this.db
      .selectFrom("customer_addresses")
      .where("id", "=", input.id)
      .where("customer_id", "=", input.customer_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();
    if (!existing) {
      throw new ValidationError("Address not found", [
        { type: "not_found", message: "Address not found", path: "id" },
      ]);
    }

    return this.db
      .updateTable("customer_addresses")
      .set({
        first_name: input.first_name ?? null,
        last_name: input.last_name ?? null,
        phone: input.phone ?? null,
        company: input.company ?? null,
        address_1: input.address_1,
        address_2: input.address_2 ?? null,
        city: input.city,
        country_code: input.country_code,
        province: input.province ?? null,
        postal_code: input.postal_code ?? null,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", input.id)
      .where("customer_id", "=", input.customer_id)
      .returningAll()
      .executeTakeFirst();
  }
}
