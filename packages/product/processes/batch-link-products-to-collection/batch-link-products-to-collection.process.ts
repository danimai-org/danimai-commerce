import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("BatchLinkProductsToCollection")
export class BatchLinkProductsToCollectionProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
