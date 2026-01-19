import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("UpdateProductVariants")
export class UpdateProductVariantsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
