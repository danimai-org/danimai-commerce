import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("UpdateProductTags")
export class UpdateProductTagsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
