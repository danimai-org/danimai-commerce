import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type CreateCartProcessOutput,
  CreateCartSchema,
} from "./create-cart.schema";
import type { Database } from "@danimai/cart/db";

export const CREATE_CART_PROCESS = Symbol("CreateCart");

@Process(CREATE_CART_PROCESS)
export class CreateCartProcess
  implements ProcessContract<typeof CreateCartSchema, CreateCartProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreateCartSchema })
    context: ProcessContextType<typeof CreateCartSchema>
  ) {
    const { input } = context;

    return this.db
      .insertInto("carts")
      .values({
        email: input.email ?? null,
        currency_code: input.currency_code ?? null,
        region_id: input.region_id ?? null,
        customer_id: input.customer_id ?? null,
        session_id: input.session_id,
        type: null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
