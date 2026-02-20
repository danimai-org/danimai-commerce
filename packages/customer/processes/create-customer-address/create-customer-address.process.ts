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
} from "./create-customer-address.schema";
import type { Database, CustomerAddress } from "../../db/type";

export const CREATE_CUSTOMER_ADDRESS_PROCESS = Symbol("CreateCustomerAddress");

@Process(CREATE_CUSTOMER_ADDRESS_PROCESS)
export class CreateCustomerAddressProcess
  implements ProcessContract<CustomerAddress | undefined>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CreateCustomerAddressSchema,
    })
    context: ProcessContextType<typeof CreateCustomerAddressSchema>
  ) {
    const { input } = context;
    return this.createAddress(input);
  }

  async createAddress(input: CreateCustomerAddressProcessInput) {
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

    return this.db
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
  }
}
