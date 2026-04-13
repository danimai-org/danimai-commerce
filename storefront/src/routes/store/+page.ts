// import { rowsFromPaginated } from "$lib/api/storefront-api";
// import { client } from "$lib/api/client.js";

// export type ProductGridItem = {
//   name: string;
//   price: {
//     amount: number;
//     currency_code: string;
//   };
//   href: string;
//   bg: string;
//   image?: string | null;
//   currency_code?: string | null;
// };

// const FALLBACK_BGS = ["#e8e0d5", "#4a4a4a", "#f5f0eb", "#6b7c5c"];

// function pickBg(index: number): string {
//   return FALLBACK_BGS[index % FALLBACK_BGS.length];
// }

// function normalizePrice(
//   value: number | string | null | undefined,
// ): number | null {
//   if (typeof value === "number") {
//     return Number.isFinite(value) ? value : null;
//   }
//   if (typeof value === "string") {
//     const parsed = parseFloat(value);
//     return Number.isFinite(parsed) ? parsed : null;
//   }
//   return null;
// }

// async function fetchVariantPrice(
//   variantId: string,
// ): Promise<{ amount: number; currency_code: string } | null> {
//   try {
//     const res = await client["product-variants"]({ id: variantId }).get();
//     if (res.error) return null;
//     const data = res.data as unknown;
//     const prices =
//       (data as { prices?: Array<{ amount: string; currency_code: string }> })
//         .prices ?? [];
//     if (prices.length === 0) return null;
//     const p = prices[0];
//     const amount = parseInt(p.amount, 10) / 100;
//     return { amount, currency_code: p.currency_code };
//   } catch {
//     return null;
//   }
// }

// export async function load() {
//   const products: ProductGridItem[] = [];
//   let error: string | null = null;

//   try {
//     const res = await client.products.get({
//       query: { limit: "100", page: "1" },
//     });
//     if (res.error) {
//       error = "Products failed";
//       return { products, error };
//     }
//     const data = res.data as unknown;
//     const { rows: list } = rowsFromPaginated<{
//       id: string;
//       title: string;
//       handle: string;
//       thumbnail?: string | null;
//       variants?: Array<{ id: string }>;
//     }>(data);
//     const variantMap = await client["product-variants"].get({
//       query: {
//         limit: "100",
//         page: "1",
//         filters: { product_id: list.map((p) => p.id) },
//       },
//     });
//     if (variantMap.error) throw new Error("Failed to load variants");
//     const variantMapData = variantMap.data as unknown;
//     const variantIds =
//       (variantMapData as { rows?: Array<{ id: string }> }).rows?.map(
//         (v: { id: string }) => v.id,
//       ) ?? [];
//     const pricePromises = variantIds.map((id: string) =>
//       fetchVariantPrice(id as string),
//     );
//     const prices = await Promise.all(pricePromises);

//     let priceIndex = 0;
//     for (let i = 0; i < list.length; i++) {
//       const p = list[i];
//       const firstVariantId =
//         p.variants?.[0]?.id ??
//         (variantMapData as { rows?: Array<{ id: string }> }).rows?.find(
//           (v: { id: string }) => v.id === p.id,
//         )?.id ??
//         null;
//       const price = prices[priceIndex];
//       priceIndex++;
//       products.push({
//         name: p.title,
//         price: {
//           amount: price?.amount ?? 0,
//           currency_code: price?.currency_code ?? "USD",
//         },
//         href: `/products/${p.handle}`,
//         bg: pickBg(i),
//         image: p.thumbnail || null,
//       });
//     }
//   } catch (e) {
//     error = e instanceof Error ? e.message : "Failed to load products";
//   }

//   return { products, error };
// }
