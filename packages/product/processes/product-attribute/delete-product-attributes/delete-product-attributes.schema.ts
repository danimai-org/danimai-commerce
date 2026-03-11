import { commaSeparatedIds } from "@danimai/core";
import { Type, type StaticDecode } from "@sinclair/typebox";

export const DeleteProductAttributesSchema = Type.Object({
  ids: commaSeparatedIds({ uniqueItems: true, format: "uuid" }),
});

export type DeleteProductAttributesProcessInput = StaticDecode<
  typeof DeleteProductAttributesSchema
>;

export const DeleteProductAttributesResponseSchema = Type.Undefined();
export type DeleteProductAttributesProcessOutput = void;
