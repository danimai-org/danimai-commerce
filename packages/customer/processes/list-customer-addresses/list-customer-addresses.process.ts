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
} from "./list-customer-addresses.schema";
import type { Database, CustomerAddress } from "../../db/type";

export const LIST_CUSTOMER_ADDRESSES_PROCESS = Symbol("ListCustomerAddresses");

@Process(LIST_CUSTOMER_ADDRESSES_PROCESS)
export class ListCustomerAddressesProcess
  implements ProcessContract<CustomerAddress[]>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

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
