import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("CreateProductVariants")
export class CreateProductVariantsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
