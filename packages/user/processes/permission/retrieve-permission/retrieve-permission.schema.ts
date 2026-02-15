import { Type, type Static } from "typebox";

export const RetrievePermissionSchema = Type.Object({
  id: Type.String(),
});

export type RetrievePermissionProcessInput = Static<
  typeof RetrievePermissionSchema
>;
