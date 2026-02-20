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
  RemoveCustomerFromGroupSchema,
  type RemoveCustomerFromGroupProcessInput,
} from "./remove-customer-from-group.schema";
import type { Database } from "../../db/type";

export const REMOVE_CUSTOMER_FROM_GROUP_PROCESS = Symbol(
  "RemoveCustomerFromGroup"
);

@Process(REMOVE_CUSTOMER_FROM_GROUP_PROCESS)
export class RemoveCustomerFromGroupProcess
  implements ProcessContract<void>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: RemoveCustomerFromGroupSchema,
    })
    context: ProcessContextType<typeof RemoveCustomerFromGroupSchema>
  ) {
    const { input } = context;
    return this.removeCustomerFromGroup(input);
  }

  async removeCustomerFromGroup(input: RemoveCustomerFromGroupProcessInput) {
    this.logger.info("Removing customer from group(s)", {
      customer_id: input.customer_id,
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

    let q = this.db
      .deleteFrom("customer_group_customers")
      .where("customer_id", "=", input.customer_id);
    if (input.customer_group_id != null) {
      q = q.where("customer_group_id", "=", input.customer_group_id);
    }
    await q.execute();
  }
}
