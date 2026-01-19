import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("BatchVariantImages")
export class BatchVariantImagesProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
