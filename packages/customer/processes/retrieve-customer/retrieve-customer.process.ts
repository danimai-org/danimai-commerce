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
  type RetrieveCustomerProcessInput,
  RetrieveCustomerSchema,
} from "./retrieve-customer.schema";
import type { Database, Customer } from "../../db/type";

export const RETRIEVE_CUSTOMER_PROCESS = Symbol("RetrieveCustomer");

@Process(RETRIEVE_CUSTOMER_PROCESS)
export class RetrieveCustomerProcess
  implements ProcessContract<Customer | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: RetrieveCustomerSchema,
    })
    context: ProcessContextType<typeof RetrieveCustomerSchema>
  ) {
    const { input } = context;

    const customer = await this.db
      .selectFrom("customers")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!customer) {
      throw new ValidationError("Customer not found", [
        {
          type: "not_found",
          message: "Customer not found",
          path: "id",
        },
      ]);
    }

    const groups = await this.db
      .selectFrom("customer_group_customers")
      .innerJoin("customer_groups", "customer_groups.id", "customer_group_customers.customer_group_id")
      .where("customer_group_customers.customer_id", "=", input.id)
      .where("customer_groups.deleted_at", "is", null)
      .select(["customer_groups.id as id", "customer_groups.name as name"])
      .execute();

    const metadata = (customer.metadata as Record<string, unknown>) ?? {};
    const customer_groups = groups.map((g) => ({ id: g.id, name: g.name }));
    if (customer_groups.length > 0) {
      (metadata as Record<string, unknown>).customer_groups = customer_groups;
      (metadata as Record<string, unknown>).customer_group_name = customer_groups[0].name;
    }

    return { ...customer, metadata: Object.keys(metadata).length > 0 ? metadata : customer.metadata };
  }
}
