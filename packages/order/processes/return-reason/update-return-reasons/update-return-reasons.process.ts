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
  type UpdateReturnReasonProcessInput,
  UpdateReturnReasonSchema,
} from "./update-return-reasons.schema";
import type { Database, ReturnReason } from "@danimai/order/db";

export const UPDATE_RETURN_REASONS_PROCESS = Symbol("UpdateReturnReasons");

@Process(UPDATE_RETURN_REASONS_PROCESS)
export class UpdateReturnReasonsProcess
  implements ProcessContract<ReturnReason | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateReturnReasonSchema })
    context: ProcessContextType<typeof UpdateReturnReasonSchema>
  ) {
    const { input } = context;
    await this.validateReturnReason(input);
    return this.updateReturnReason(input);
  }

  async validateReturnReason(input: UpdateReturnReasonProcessInput) {
    const row = await this.db
      .selectFrom("return_reasons")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Return reason not found", [
        { type: "not_found", message: "Return reason not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateReturnReason(input: UpdateReturnReasonProcessInput) {
    this.logger.info("Updating return reason", { input });
    const updateData: {
      label?: string;
      description?: string | null;
      metadata?: unknown;
    } = {};
    if (input.label !== undefined) updateData.label = input.label;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("return_reasons")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
