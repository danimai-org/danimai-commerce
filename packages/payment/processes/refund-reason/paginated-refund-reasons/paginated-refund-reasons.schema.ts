import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";

export const RefundReasonResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  label: Type.String(),
  value: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

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
