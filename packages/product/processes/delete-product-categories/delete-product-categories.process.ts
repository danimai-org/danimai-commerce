import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("DeleteProductCategories")
export class DeleteProductCategoriesProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
