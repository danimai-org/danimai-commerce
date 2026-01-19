import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("CreateProductTags")
export class CreateProductTagsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
