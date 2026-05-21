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
  type DeleteCustomersProcessInput,
  DeleteCustomersSchema,
} from "./delete-customers.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the delete customers process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const DELETE_CUSTOMERS_PROCESS = Symbol("DeleteCustomers");

@Process(DELETE_CUSTOMERS_PROCESS)
export class DeleteCustomersProcess
  implements ProcessContract<typeof DeleteCustomersSchema>
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
    @ProcessContext({ schema: DeleteCustomersSchema })
    context: ProcessContextType<typeof DeleteCustomersSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateCustomers(input);
    await this.deleteCustomers(input);
  }

  async validateCustomers(input: DeleteCustomersProcessInput) {
    const rows = await this.db
      .selectFrom("customers")
      .where("id", "in", input.customer_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.customer_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.customer_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Customers not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Customers not found: ${missing.join(", ")}`,
            path: "customer_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteCustomers(input: DeleteCustomersProcessInput) {
    this.logger.info("Deleting customers", {
      customer_ids: input.customer_ids,
    });
    await this.db
      .updateTable("customers")
      .set({ deleted_at: new Date() })
      .where("id", "in", input.customer_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
