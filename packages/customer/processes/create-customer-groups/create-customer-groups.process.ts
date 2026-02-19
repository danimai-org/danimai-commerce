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
  type CreateCustomerGroupProcessInput,
  CreateCustomerGroupsSchema,
} from "./create-customer-groups.schema";
import type { Database, CustomerGroup } from "../../db/type";

export const CREATE_CUSTOMER_GROUPS_PROCESS = Symbol("CreateCustomerGroups");

@Process(CREATE_CUSTOMER_GROUPS_PROCESS)
export class CreateCustomerGroupsProcess
  implements ProcessContract<CustomerGroup[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CreateCustomerGroupsSchema,
    })
    context: ProcessContextType<typeof CreateCustomerGroupsSchema>
  ) {
    const { input } = context;

    const created: CustomerGroup[] = [];
    for (const cg of input.customer_groups) {
      const customerGroup = await this.createCustomerGroup(cg);
      if (customerGroup) created.push(customerGroup);
    }
    return created;
  }

  async createCustomerGroup(input: CreateCustomerGroupProcessInput) {
    this.logger.info("Creating customer group", { input });

    return this.db
      .insertInto("customer_groups")
      .values({
        name: input.name,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
