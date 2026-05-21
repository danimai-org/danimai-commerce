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
  CreateCustomerAddressSchema,
  type CreateCustomerAddressProcessInput,
  type CreateCustomerAddressProcessOutput,
} from "./create-customer-address.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the create customer address process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_CUSTOMER_ADDRESS_PROCESS = Symbol("CreateCustomerAddress");

@Process(CREATE_CUSTOMER_ADDRESS_PROCESS)
export class CreateCustomerAddressProcess
  implements ProcessContract<
    typeof CreateCustomerAddressSchema,
    CreateCustomerAddressProcessOutput
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
      schema: CreateCustomerAddressSchema,
    })
    context: ProcessContextType<typeof CreateCustomerAddressSchema>
  ): Promise<CreateCustomerAddressProcessOutput> {
    const { input } = context;
    return this.createAddress(input);
  }

  async createAddress(
    input: CreateCustomerAddressProcessInput
  ): Promise<CreateCustomerAddressProcessOutput> {
    this.logger.info("Creating customer address", {
      customer_id: input.customer_id,
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

    const row = await this.db
      .insertInto("customer_addresses")
      .values({
        customer_id: input.customer_id,
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
      })
      .returningAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Failed to create address", [
        {
          type: "internal",
          message: "Failed to create address",
          path: "customer_id",
        },
      ]);
    }
    return row;
  }
}
