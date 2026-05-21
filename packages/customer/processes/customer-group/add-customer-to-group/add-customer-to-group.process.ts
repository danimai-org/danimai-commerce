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
  type AddCustomerToGroupProcessOutput,
} from "./add-customer-to-group.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the add customer to group process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const ADD_CUSTOMER_TO_GROUP_PROCESS = Symbol("AddCustomerToGroup");

@Process(ADD_CUSTOMER_TO_GROUP_PROCESS)
export class AddCustomerToGroupProcess
  implements ProcessContract<typeof AddCustomerToGroupSchema, AddCustomerToGroupProcessOutput>
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
      schema: AddCustomerToGroupSchema,
    })
    context: ProcessContextType<typeof AddCustomerToGroupSchema>
  ): Promise<AddCustomerToGroupProcessOutput> {
    const { input } = context;
    return this.addCustomerToGroup(input);
  }

  async addCustomerToGroup(
    input: AddCustomerToGroupProcessInput
  ): Promise<AddCustomerToGroupProcessOutput> {
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
      const row = await this.db
        .selectFrom("customer_group_customers")
        .where("customer_id", "=", input.customer_id)
        .where("customer_group_id", "=", input.customer_group_id)
        .selectAll()
        .executeTakeFirst();
      if (!row) {
        throw new ValidationError("Customer group membership not found", [
          {
            type: "not_found",
            message: "Customer group membership not found",
            path: "customer_group_id",
          },
        ]);
      }
      return row;
    }

    const row = await this.db
      .insertInto("customer_group_customers")
      .values({
        customer_id: input.customer_id,
        customer_group_id: input.customer_group_id,
      })
      .returningAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Failed to add customer to group", [
        {
          type: "internal",
          message: "Failed to add customer to group",
          path: "customer_group_id",
        },
      ]);
    }
    return row;
  }
}
