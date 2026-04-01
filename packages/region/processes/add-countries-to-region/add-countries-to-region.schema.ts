import { Type, type Static } from "@sinclair/typebox";

export const AddCountriesToRegionSchema = Type.Object({
	region_id: Type.String(),
	ids: Type.Array(Type.String()),
});

export type AddCountriesToRegionProcessInput = Static<typeof AddCountriesToRegionSchema>;

export const AddCountriesToRegionResponseSchema = Type.Undefined();

export type AddCountriesToRegionProcessOutput = void;
