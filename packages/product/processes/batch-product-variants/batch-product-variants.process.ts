import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("BatchProductVariants")
export class BatchProductVariantsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
