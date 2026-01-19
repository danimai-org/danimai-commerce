import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("CreateProducts")
export class CreateProductsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
