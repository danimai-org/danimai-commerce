import {
  InjectDB,
  InjectLogger,
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";

@Process("CreateProduct")
export class CreateProductProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<unknown>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(context: ProcessContext) {
    const createdProduct = await this.createProduct();

    return createdProduct;
  }

  async createProduct(input: CreateProductInput) {
    this.logger.info("Creating product");
  }
}

// export const getProductProcess = () =>
