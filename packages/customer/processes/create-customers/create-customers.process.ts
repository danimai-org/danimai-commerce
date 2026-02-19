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
  type CreateCustomerProcessInput,
  CreateCustomersSchema,
} from "./create-customers.schema";
import type { Database, Customer } from "../../db/type";

export const CREATE_CUSTOMERS_PROCESS = Symbol("CreateCustomers");

@Process(CREATE_CUSTOMERS_PROCESS)
export class CreateCustomersProcess
  implements ProcessContract<Customer[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CreateCustomersSchema,
    })
    context: ProcessContextType<typeof CreateCustomersSchema>
  ) {
    const { input } = context;

    const created: Customer[] = [];
    for (const c of input.customers) {
      const customer = await this.createCustomer(c);
      if (customer) created.push(customer);
    }
    return created;
  }

  async createCustomer(input: CreateCustomerProcessInput) {
    this.logger.info("Creating customer", { input });

    return this.db
      .insertInto("customers")
      .values({
        email: input.email,
        first_name: input.first_name ?? null,
        last_name: input.last_name ?? null,
        phone: input.phone ?? null,
        has_account: input.has_account ?? false,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
