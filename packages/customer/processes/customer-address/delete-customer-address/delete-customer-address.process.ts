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
  type DeleteCustomerAddressProcessOutput,
} from "./delete-customer-address.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the delete customer address process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const DELETE_CUSTOMER_ADDRESS_PROCESS = Symbol("DeleteCustomerAddress");

@Process(DELETE_CUSTOMER_ADDRESS_PROCESS)
export class DeleteCustomerAddressProcess
  implements ProcessContract<
    typeof DeleteCustomerAddressSchema,
    DeleteCustomerAddressProcessOutput
  >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({
      schema: DeleteCustomerAddressSchema,
    })
    context: ProcessContextType<typeof DeleteCustomerAddressSchema>
  ): Promise<DeleteCustomerAddressProcessOutput> {
    const { input } = context;
    return this.deleteAddress(input);
  }

  async deleteAddress(
    input: DeleteCustomerAddressProcessInput
  ): Promise<DeleteCustomerAddressProcessOutput> {
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

    const row = await this.db
      .updateTable("customer_addresses")
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where("id", "=", input.id)
      .where("customer_id", "=", input.customer_id)
      .returningAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Address not found", [
        { type: "not_found", message: "Address not found", path: "id" },
      ]);
    }
    return row;
  }
}
