import { Type, type Static } from "typebox";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateReturnReasonSchema = Type.Object({
  label: Type.String(),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export const CreateReturnReasonsSchema = Type.Object({
  return_reasons: Type.Array(CreateReturnReasonSchema),
});

export type CreateReturnReasonProcessInput = Static<typeof CreateReturnReasonSchema>;
export type CreateReturnReasonsProcessInput = Static<typeof CreateReturnReasonsSchema>;
