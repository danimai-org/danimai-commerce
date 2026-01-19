import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("CreateProductTypes")
export class CreateProductTypesProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
