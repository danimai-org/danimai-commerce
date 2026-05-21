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
  ListCustomerAddressesSchema,
  type ListCustomerAddressesProcessInput,
  type ListCustomerAddressesProcessOutput,
} from "./list-customer-addresses.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the list customer addresses process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const LIST_CUSTOMER_ADDRESSES_PROCESS = Symbol("ListCustomerAddresses");

@Process(LIST_CUSTOMER_ADDRESSES_PROCESS)
export class ListCustomerAddressesProcess
  implements ProcessContract<
    typeof ListCustomerAddressesSchema,
    ListCustomerAddressesProcessOutput
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
      schema: ListCustomerAddressesSchema,
    })
    context: ProcessContextType<typeof ListCustomerAddressesSchema>
  ) {
    const { input } = context;
    return this.listAddresses(input);
  }

  async listAddresses(input: ListCustomerAddressesProcessInput) {
    return this.db
      .selectFrom("customer_addresses")
      .where("customer_id", "=", input.customer_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .orderBy("created_at", "asc")
      .execute();
  }
}
