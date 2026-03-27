import { Type, type Static } from "@sinclair/typebox";

export const RemoveCountriesFromRegionSchema = Type.Object({
	region_id: Type.String(),
	ids: Type.Array(Type.String()),
});

export type RemoveCountriesFromRegionProcessInput = Static<typeof RemoveCountriesFromRegionSchema>;

export const RemoveCountriesFromRegionResponseSchema = Type.Undefined();

export type RemoveCountriesFromRegionProcessOutput = void;
