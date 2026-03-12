import { z } from 'zod';

export const tagSchema = z.object({
    id: z.string().optional(), // Optional because 'create' won't have an ID
    value: z.string().min(1, "Value is required").max(50, "Tag is too long"),
});

export type TagSchema = typeof tagSchema;