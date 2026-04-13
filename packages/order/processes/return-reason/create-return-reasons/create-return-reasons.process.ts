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
  type CreateReturnReasonProcessInput,
  CreateReturnReasonsSchema,
} from "./create-return-reasons.schema";
import type { Database, ReturnReason } from "@danimai/order/db";

/**
 * Handles the create return reasons process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_RETURN_REASONS_PROCESS = Symbol("CreateReturnReasons");

@Process(CREATE_RETURN_REASONS_PROCESS)
export class CreateReturnReasonsProcess
  implements ProcessContract<ReturnReason[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: CreateReturnReasonsSchema })
    context: ProcessContextType<typeof CreateReturnReasonsSchema>
  ) {
    const { input } = context;
    const created: ReturnReason[] = [];
    for (const r of input.return_reasons) {
      const row = await this.createReturnReason(r);
      if (row) created.push(row);
    }
    return created;
  }

  async createReturnReason(input: CreateReturnReasonProcessInput) {
    this.logger.info("Creating return reason", { input });
    return this.db
      .insertInto("return_reasons")
      .values({
        label: input.label,
        description: input.description ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
