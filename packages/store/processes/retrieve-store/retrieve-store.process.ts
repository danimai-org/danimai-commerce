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
  RetrieveStoreSchema,
  StoreResponseSchema,
  RetrieveStoreProcessOutput,
} from "./retrieve-store.schema";
import type { Database, Store } from "../../../db";

/**
 * Handles the retrieve store process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_STORE_PROCESS = Symbol("RetrieveStore");

@Process(RETRIEVE_STORE_PROCESS)
export class RetrieveStoreProcess implements ProcessContract<typeof RetrieveStoreSchema, RetrieveStoreProcessOutput> {
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
    @ProcessContext({ schema: RetrieveStoreSchema })
    context: ProcessContextType<typeof RetrieveStoreSchema>
  ) {
    const { input } = context;

    const store = await this.db
      .selectFrom("stores")
      .selectAll()
      .orderBy("updated_at", "desc")
      .executeTakeFirst();

    return store;
  }
}
