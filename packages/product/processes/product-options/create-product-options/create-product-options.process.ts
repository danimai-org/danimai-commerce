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
import { type CreateProductOptionProcessInput, CreateProductOptionSchema } from "./create-product-options.schema";
import type { Database, ProductOption, Product } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_OPTIONS_PROCESS = Symbol("CreateProductOptions");

@Process(CREATE_PRODUCT_OPTIONS_PROCESS)
export class CreateProductOptionsProcess
  implements ProcessContract<ProductOption | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductOptionSchema,
  }) context: ProcessContextType<typeof CreateProductOptionSchema>) {
    const { input } = context;

    const product = await this.validateProduct(input);

    return this.createProductOption(input, product);
  }

  async validateProduct(input: CreateProductOptionProcessInput): Promise<Product | null> {
    if (!input.product_id) {
      return null;
    }

    const product = await this.db
      .selectFrom("products")
      .where("id", "=", input.product_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!product) {
      throw new ValidationError("Product not found", [{
        type: "not_found",
        message: "Product not found",
        path: "product_id",
      }]);
    }

    return product;
  }

  async createProductOption(input: CreateProductOptionProcessInput, product: Product | null) {
    this.logger.info("Creating product option", { input });

    const title = input.title?.trim();
    if (!title) {
      throw new ValidationError("Option title is required", [{
        type: "required",
        message: "Option title is required",
        path: "title",
      }]);
    }

    const key = title.toLowerCase();
    const existing = await this.db
      .selectFrom("product_options")
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const match = existing.find((o) => o.title.toLowerCase() === key);
    if (match) {
      return match;
    }

    return this.db
      .insertInto("product_options")
      .values({
        id: randomUUID(),
        title,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
