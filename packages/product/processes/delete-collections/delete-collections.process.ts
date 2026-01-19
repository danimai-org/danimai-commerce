import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("DeleteCollections")
export class DeleteCollectionsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
