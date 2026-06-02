import {
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { PaymentStatus } from "../../../db/type";
import {
  ListRefundStatusesSchema,
  type ListRefundStatusesProcessOutput,
} from "./list-refund-statuses.schema";

const REFUND_STATUS_OPTIONS: { id: PaymentStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "succeeded", label: "Succeeded" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
];

/**
 * Lists refund status options with optional search.
 * Input: optional search string matched against status id or label.
 * Output: array of { id, label } status options.
 */
export const LIST_REFUND_STATUSES_PROCESS = Symbol("ListRefundStatuses");

@Process(LIST_REFUND_STATUSES_PROCESS)
export class ListRefundStatusesProcess
  implements
    ProcessContract<
      typeof ListRefundStatusesSchema,
      ListRefundStatusesProcessOutput
    >
{
  async runOperations(
    @ProcessContext({ schema: ListRefundStatusesSchema })
    context: ProcessContextType<typeof ListRefundStatusesSchema>
  ): Promise<ListRefundStatusesProcessOutput> {
    const search = (context.input.search ?? "").trim().toLowerCase();
    if (!search) {
      return REFUND_STATUS_OPTIONS.map((option) => ({ ...option }));
    }

    return REFUND_STATUS_OPTIONS.filter(
      (option) =>
        option.id.includes(search) ||
        option.label.toLowerCase().includes(search)
    ).map((option) => ({ ...option }));
  }
}
