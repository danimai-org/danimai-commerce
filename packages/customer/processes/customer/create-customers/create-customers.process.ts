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
  type CreateCustomerResponseOutput,
  CreateCustomersSchema,
  type CreateCustomersProcessOutput,
} from "./create-customers.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the create customers process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_CUSTOMERS_PROCESS = Symbol("CreateCustomers");

@Process(CREATE_CUSTOMERS_PROCESS)
export class CreateCustomersProcess
  implements
    ProcessContract<typeof CreateCustomersSchema, CreateCustomersProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({
      schema: CreateCustomersSchema,
    })
    context: ProcessContextType<typeof CreateCustomersSchema>,
  ) {
    const { input } = context;

    const created: CreateCustomersProcessOutput = [];
    for (const c of input.customers) {
      const customer = await this.createCustomer(c);
      if (customer) created.push(customer);
    }
    return created;
  }

  async createCustomer(
    input: CreateCustomerProcessInput
  ): Promise<CreateCustomerResponseOutput | undefined> {
    this.logger.info("Creating customer", { input });

    return this.db
      .insertInto("customers")
      .values({
        email: input.email,
        first_name: input.first_name ?? null,
        last_name: input.last_name ?? null,
        phone: input.phone ?? null,
        has_account: input.has_account ?? false,
        active: input.active ?? true,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
