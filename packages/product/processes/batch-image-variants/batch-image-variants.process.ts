import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("BatchImageVariants")
export class BatchImageVariantsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
