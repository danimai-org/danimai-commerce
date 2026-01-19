import {
  Process,
  type ProcessContext,
  type ProcessContract,
} from "@danimai/core";

@Process("UpdateCollections")
export class UpdateCollectionsProcess implements ProcessContract<void> {
  async runOperations(context: ProcessContext): Promise<void> {
    return;
  }
}
