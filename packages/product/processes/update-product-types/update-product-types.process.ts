import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("UpdateProductTypes")
export class UpdateProductTypesProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
