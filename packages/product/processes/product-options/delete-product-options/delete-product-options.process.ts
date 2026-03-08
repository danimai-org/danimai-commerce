import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { DeleteProductOptionsSchema } from "./delete-product-options.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_OPTIONS_PROCESS = Symbol("DeleteProductOptions");

@Process(DELETE_PRODUCT_OPTIONS_PROCESS)
export class DeleteProductOptionsProcess implements ProcessContract<typeof DeleteProductOptionsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductOptionsSchema,
  }) context: ProcessContextType<typeof DeleteProductOptionsSchema>) {
    const { input } = context;

    const options = await this.db
      .selectFrom("product_options")
      .where("product_options.id", "in", input.option_ids)
      .select("product_options.id")
      .execute();

    if (options.length !== input.option_ids.length) {
      const foundIds = options.map((o) => o.id);
      const missingIds = input.option_ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(
        `Product options not found: ${missingIds.join(", ")}`
      );
    }

    await this.db.transaction().execute(async (trx) => {
      const optionValueIds = await trx
        .selectFrom("product_option_values")
        .where("option_id", "in", input.option_ids)
        .select("id")
        .execute()
        .then((rows) => rows.map((r) => r.id));

      if (optionValueIds.length > 0) {
        this.logger.info("Deleting variant-option relations", {
          option_ids: input.option_ids,
          option_value_ids: optionValueIds,
        });
        await trx
          .deleteFrom("product_variant_option_relations")
          .where("option_value_id", "in", optionValueIds)
          .execute();
      }

      this.logger.info("Deleting product option values", {
        option_ids: input.option_ids,
      });
      await trx
        .updateTable("product_option_values")
        .set({ deleted_at: new Date() })
        .where("option_id", "in", input.option_ids)
        .execute();

      this.logger.info("Deleting product options", {
        option_ids: input.option_ids,
      });

      await trx
        .updateTable("product_options")
        .set({ deleted_at: new Date() })
        .where("id", "in", input.option_ids)
        .execute();
    });
  }
}
