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
  DeleteCustomerAddressSchema,
  type DeleteCustomerAddressProcessInput,
} from "./delete-customer-address.schema";
import type { Database, CustomerAddress } from "../../db/type";

export const DELETE_CUSTOMER_ADDRESS_PROCESS = Symbol("DeleteCustomerAddress");

@Process(DELETE_CUSTOMER_ADDRESS_PROCESS)
export class DeleteCustomerAddressProcess
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
      schema: DeleteCustomerAddressSchema,
    })
    context: ProcessContextType<typeof DeleteCustomerAddressSchema>
  ) {
    const { input } = context;
    return this.deleteAddress(input);
  }

  async deleteAddress(input: DeleteCustomerAddressProcessInput) {
    this.logger.info("Deleting customer address", {
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
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", input.id)
      .where("customer_id", "=", input.customer_id)
      .returningAll()
      .executeTakeFirst();
  }
}
