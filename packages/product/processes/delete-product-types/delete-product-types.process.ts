import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("DeleteProductTypes")
export class DeleteProductTypesProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
