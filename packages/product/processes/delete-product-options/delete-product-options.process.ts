import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("DeleteProductOptions")
export class DeleteProductOptionsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
