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
  type ExportProductsProcessInput,
  ExportProductsSchema,
} from "./export-products.schema";
import type { Database as RegionDatabase } from "@danimai/region/db";
import type {
  Database as ProductDatabase,
  Product,
} from "@danimai/product";

type RegionWithProductDB = RegionDatabase & ProductDatabase;

export const EXPORT_PRODUCTS_PROCESS = Symbol("ExportProducts");

@Process(EXPORT_PRODUCTS_PROCESS)
export class ExportProductsProcess
  implements ProcessContract<{ products: Product[]; total: number }> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<RegionWithProductDB>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: ExportProductsSchema,
    })
    context: ProcessContextType<typeof ExportProductsSchema>
  ) {
    const { input } = context;
    const limit = input.limit ?? 100;
    const offset = input.offset ?? 0;

    this.logger.info("Exporting products", { limit, offset });

    const base = this.db
      .selectFrom("products")
      .where("deleted_at", "is", null);

    const [data, countResult] = await Promise.all([
      base.selectAll().limit(limit).offset(offset).orderBy("created_at", "desc").execute(),
      base.select(({ fn }) => fn.count<number>("id").as("count")).executeTakeFirst(),
    ]);

    const total = Number(countResult?.count ?? 0);
    return { products: data as Product[], total };
  }
}
