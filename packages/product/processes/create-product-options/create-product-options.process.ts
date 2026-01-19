import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("CreateProductOptions")
export class CreateProductOptionsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
