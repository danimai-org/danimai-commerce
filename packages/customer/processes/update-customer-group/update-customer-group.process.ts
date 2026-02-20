import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateCustomerGroupProcessInput,
  UpdateCustomerGroupSchema,
} from "./update-customer-group.schema";
import type { Database, CustomerGroup } from "@danimai/customer/db";

export const UPDATE_CUSTOMER_GROUP_PROCESS = Symbol("UpdateCustomerGroup");

@Process(UPDATE_CUSTOMER_GROUP_PROCESS)
export class UpdateCustomerGroupProcess implements ProcessContract<CustomerGroup | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdateCustomerGroupSchema })
    context: ProcessContextType<typeof UpdateCustomerGroupSchema>
  ) {
    const { input } = context;
    await this.validateCustomerGroup(input);
    return this.updateCustomerGroup(input);
  }

  async validateCustomerGroup(input: UpdateCustomerGroupProcessInput) {
    const row = await this.db
      .selectFrom("customer_groups")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Customer group not found", [
        { type: "not_found", message: "Customer group not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateCustomerGroup(input: UpdateCustomerGroupProcessInput) {
    this.logger.info("Updating customer group", { input });
    const updateData: {
      name?: string;
      metadata?: unknown;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("customer_groups")
      .set({ ...updateData, updated_at: sql`now()` })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
