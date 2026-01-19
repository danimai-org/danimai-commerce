import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("BatchLinkProductsToCategory")
export class BatchLinkProductsToCategoryProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
