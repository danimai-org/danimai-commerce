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
  type DeleteReturnReasonsProcessInput,
  DeleteReturnReasonsSchema,
} from "./delete-return-reasons.schema";
import type { Database } from "@danimai/order/db";

export const DELETE_RETURN_REASONS_PROCESS = Symbol("DeleteReturnReasons");

@Process(DELETE_RETURN_REASONS_PROCESS)
export class DeleteReturnReasonsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteReturnReasonsSchema })
    context: ProcessContextType<typeof DeleteReturnReasonsSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateReturnReasons(input);
    await this.deleteReturnReasons(input);
  }

  async validateReturnReasons(input: DeleteReturnReasonsProcessInput) {
    const rows = await this.db
      .selectFrom("return_reasons")
      .where("id", "in", input.return_reason_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.return_reason_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.return_reason_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Return reasons not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Return reasons not found: ${missing.join(", ")}`,
            path: "return_reason_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteReturnReasons(input: DeleteReturnReasonsProcessInput) {
    this.logger.info("Deleting return reasons", {
      return_reason_ids: input.return_reason_ids,
    });
    await this.db
      .updateTable("return_reasons")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.return_reason_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
