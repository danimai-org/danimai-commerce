import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { DeleteProductVariantsSchema } from "./delete-product-variants.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_VARIANTS_PROCESS = Symbol("DeleteProductVariants");

@Process(DELETE_PRODUCT_VARIANTS_PROCESS)
export class DeleteProductVariantsProcess implements ProcessContract<typeof DeleteProductVariantsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductVariantsSchema,
  }) context: ProcessContextType<typeof DeleteProductVariantsSchema>) {
    const { input } = context;

    const variants = await this.db
      .selectFrom("product_variants")
      .where("id", "in", input.variant_ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (variants.length !== input.variant_ids.length) {
      const foundIds = variants.map((v) => v.id);
      const missingIds = input.variant_ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(
        `Product variants not found: ${missingIds.join(", ")}`
      );
    }

    await this.db.transaction().execute(async (trx) => {
      this.logger.info("Deleting product variants", {
        variant_ids: input.variant_ids,
      });
      await trx
        .updateTable("product_variants")
        .set({ deleted_at: new Date() })
        .where("id", "in", input.variant_ids)
        .where("deleted_at", "is", null)
        .execute();
    });
  }
}
