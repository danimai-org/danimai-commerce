import { Type, type Static } from "typebox";

export const UpdateTaxProviderSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  is_installed: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateTaxProviderProcessInput = Static<typeof UpdateTaxProviderSchema>;
