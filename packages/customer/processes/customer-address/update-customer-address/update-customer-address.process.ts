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
  UpdateCustomerAddressSchema,
  type UpdateCustomerAddressProcessInput,
  type UpdateCustomerAddressProcessOutput,
} from "./update-customer-address.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the update customer address process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_CUSTOMER_ADDRESS_PROCESS = Symbol("UpdateCustomerAddress");

@Process(UPDATE_CUSTOMER_ADDRESS_PROCESS)
export class UpdateCustomerAddressProcess
  implements ProcessContract<
    typeof UpdateCustomerAddressSchema,
    UpdateCustomerAddressProcessOutput
  >
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
      schema: UpdateCustomerAddressSchema,
    })
    context: ProcessContextType<typeof UpdateCustomerAddressSchema>
  ): Promise<UpdateCustomerAddressProcessOutput> {
    const { input } = context;
    return this.updateAddress(input);
  }

  async updateAddress(
    input: UpdateCustomerAddressProcessInput
  ): Promise<UpdateCustomerAddressProcessOutput> {
    this.logger.info("Updating customer address", {
      id: input.id,
      customer_id: input.customer_id,
    });

    const existing = await this.db
      .selectFrom("customer_addresses")
      .where("id", "=", input.id)
      .where("customer_id", "=", input.customer_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();
    if (!existing) {
      throw new ValidationError("Address not found", [
        { type: "not_found", message: "Address not found", path: "id" },
      ]);
    }

    return this.db.transaction().execute(async (trx) => {
      if (input.is_default === true) {
        await trx
          .updateTable("customer_addresses")
          .set({ is_default: false, updated_at: new Date() })
          .where("customer_id", "=", input.customer_id)
          .where("deleted_at", "is", null)
          .where("is_default", "=", true)
          .where("id", "!=", input.id)
          .execute();
      }

      const row = await trx
        .updateTable("customer_addresses")
        .set({
          first_name: input.first_name ?? null,
          last_name: input.last_name ?? null,
          phone: input.phone ?? null,
          company: input.company ?? null,
          address_1: input.address_1,
          address_2: input.address_2 ?? null,
          city: input.city,
          country_code: input.country_code,
          province: input.province ?? null,
          postal_code: input.postal_code ?? null,
          ...(input.is_default !== undefined
            ? { is_default: input.is_default }
            : {}),
          updated_at: new Date(),
        })
        .where("id", "=", input.id)
        .where("customer_id", "=", input.customer_id)
        .returningAll()
        .executeTakeFirst();
      if (!row) {
        throw new ValidationError("Address not found", [
          { type: "not_found", message: "Address not found", path: "id" },
        ]);
      }
      return row;
    });
  }
}
