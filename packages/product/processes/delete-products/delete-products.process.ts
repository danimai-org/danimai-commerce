import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("DeleteProducts")
export class DeleteProductsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
