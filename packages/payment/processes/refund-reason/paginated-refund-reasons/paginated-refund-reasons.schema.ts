import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { RefundReasonResponseSchema } from "../update-refund-reason/update-refund-reason.schema";

export { RefundReasonResponseSchema };

export const PaginatedRefundReasonsSchema = createPaginationSchema(
  Type.Object({}),
  [
    "refund_reasons.id",
    "refund_reasons.label",
    "refund_reasons.value",
    "refund_reasons.created_at",
    "refund_reasons.updated_at",
  ]
);

export type PaginatedRefundReasonsProcessInput = StaticDecode<
  typeof PaginatedRefundReasonsSchema
>;

export const PaginatedRefundReasonsResponseSchema =
  createPaginatedResponseSchema(RefundReasonResponseSchema);
export type PaginatedRefundReasonsProcessOutput = Static<
  typeof PaginatedRefundReasonsResponseSchema
>;
