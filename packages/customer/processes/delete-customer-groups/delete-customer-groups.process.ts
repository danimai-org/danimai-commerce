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
  type DeleteCustomerGroupsProcessInput,
  DeleteCustomerGroupsSchema,
} from "./delete-customer-groups.schema";
import type { Database } from "@danimai/customer/db";

export const DELETE_CUSTOMER_GROUPS_PROCESS = Symbol("DeleteCustomerGroups");

@Process(DELETE_CUSTOMER_GROUPS_PROCESS)
export class DeleteCustomerGroupsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeleteCustomerGroupsSchema })
    context: ProcessContextType<typeof DeleteCustomerGroupsSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateCustomerGroups(input);
    await this.deleteCustomerGroups(input);
  }

  async validateCustomerGroups(input: DeleteCustomerGroupsProcessInput) {
    const rows = await this.db
      .selectFrom("customer_groups")
      .where("id", "in", input.customer_group_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.customer_group_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.customer_group_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Customer groups not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Customer groups not found: ${missing.join(", ")}`,
            path: "customer_group_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteCustomerGroups(input: DeleteCustomerGroupsProcessInput) {
    this.logger.info("Deleting customer groups", {
      customer_group_ids: input.customer_group_ids,
    });
    await this.db
      .updateTable("customer_groups")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.customer_group_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
