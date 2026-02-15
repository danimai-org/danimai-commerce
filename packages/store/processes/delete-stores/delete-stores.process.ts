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
  type DeleteStoresProcessInput,
  DeleteStoresSchema,
} from "./delete-stores.schema";
import type { Database } from "@danimai/store/db";

export const DELETE_STORES_PROCESS = Symbol("DeleteStores");

@Process(DELETE_STORES_PROCESS)
export class DeleteStoresProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteStoresSchema })
    context: ProcessContextType<typeof DeleteStoresSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateStores(input);
    await this.deleteStores(input);
  }

  async validateStores(input: DeleteStoresProcessInput) {
    const rows = await this.db
      .selectFrom("stores")
      .where("id", "in", input.store_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.store_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.store_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Stores not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Stores not found: ${missing.join(", ")}`,
            path: "store_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteStores(input: DeleteStoresProcessInput) {
    this.logger.info("Deleting stores", { store_ids: input.store_ids });
    await this.db
      .updateTable("stores")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.store_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
