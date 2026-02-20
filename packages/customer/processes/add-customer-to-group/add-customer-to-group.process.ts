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
  AddCustomerToGroupSchema,
  type AddCustomerToGroupProcessInput,
} from "./add-customer-to-group.schema";
import type { Database, CustomerGroupCustomer } from "../../db/type";

export const ADD_CUSTOMER_TO_GROUP_PROCESS = Symbol("AddCustomerToGroup");

@Process(ADD_CUSTOMER_TO_GROUP_PROCESS)
export class AddCustomerToGroupProcess
  implements ProcessContract<CustomerGroupCustomer | undefined>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: AddCustomerToGroupSchema,
    })
    context: ProcessContextType<typeof AddCustomerToGroupSchema>
  ) {
    const { input } = context;
    return this.addCustomerToGroup(input);
  }

  async addCustomerToGroup(input: AddCustomerToGroupProcessInput) {
    this.logger.info("Adding customer to group", {
      customer_id: input.customer_id,
      customer_group_id: input.customer_group_id,
    });

    const customer = await this.db
      .selectFrom("customers")
      .where("id", "=", input.customer_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();
    if (!customer) {
      throw new ValidationError("Customer not found", [
        { type: "not_found", message: "Customer not found", path: "customer_id" },
      ]);
    }

    const group = await this.db
      .selectFrom("customer_groups")
      .where("id", "=", input.customer_group_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();
    if (!group) {
      throw new ValidationError("Customer group not found", [
        {
          type: "not_found",
          message: "Customer group not found",
          path: "customer_group_id",
        },
      ]);
    }

    const existing = await this.db
      .selectFrom("customer_group_customers")
      .where("customer_id", "=", input.customer_id)
      .where("customer_group_id", "=", input.customer_group_id)
      .select("customer_id")
      .executeTakeFirst();
    if (existing) {
      return this.db
        .selectFrom("customer_group_customers")
        .where("customer_id", "=", input.customer_id)
        .where("customer_group_id", "=", input.customer_group_id)
        .selectAll()
        .executeTakeFirst();
    }

    return this.db
      .insertInto("customer_group_customers")
      .values({
        customer_id: input.customer_id,
        customer_group_id: input.customer_group_id,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
