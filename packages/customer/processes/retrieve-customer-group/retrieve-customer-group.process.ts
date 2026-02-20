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
  type RetrieveCustomerGroupProcessInput,
  RetrieveCustomerGroupSchema,
} from "./retrieve-customer-group.schema";
import type { Database, CustomerGroup } from "../../db/type";

export type RetrieveCustomerGroupResult = CustomerGroup & { customer_count: number };

export const RETRIEVE_CUSTOMER_GROUP_PROCESS = Symbol("RetrieveCustomerGroup");

@Process(RETRIEVE_CUSTOMER_GROUP_PROCESS)
export class RetrieveCustomerGroupProcess
  implements ProcessContract<RetrieveCustomerGroupResult | undefined>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: RetrieveCustomerGroupSchema,
    })
    context: ProcessContextType<typeof RetrieveCustomerGroupSchema>
  ) {
    const { input } = context;

    const group = await this.db
      .selectFrom("customer_groups")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!group) {
      throw new ValidationError("Customer group not found", [
        {
          type: "not_found",
          message: "Customer group not found",
          path: "id",
        },
      ]);
    }

    const countResult = await this.db
      .selectFrom("customer_group_customers")
      .where("customer_group_id", "=", input.id)
      .select(({ fn }) => fn.count<number>("customer_id").as("count"))
      .executeTakeFirst();

    const customer_count = Number(countResult?.count ?? 0);

    return { ...group, customer_count };
  }
}
