import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("UpdateProductCategories")
export class UpdateProductCategoriesProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
