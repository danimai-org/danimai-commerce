import { client, type DetailById } from '$lib/client';

export type PromotionDetail = DetailById<typeof client.promotions>;
