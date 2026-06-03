import { Type, type Static, type StaticDecode } from "@sinclair/typebox";

export const ListRefundStatusesSchema = Type.Object({
  search: Type.Optional(Type.String()),
});

export type ListRefundStatusesProcessInput = StaticDecode<
  typeof ListRefundStatusesSchema
>;

export const RefundStatusOptionSchema = Type.Object({
  id: Type.String(),
  label: Type.String(),
});

export const ListRefundStatusesResponseSchema = Type.Array(
  RefundStatusOptionSchema
);

export type ListRefundStatusesProcessOutput = Static<
  typeof ListRefundStatusesResponseSchema
>;
