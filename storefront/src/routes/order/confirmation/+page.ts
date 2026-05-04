import type { PageLoad } from "./$types";
import { client } from "$lib/api/client.js";

export type order = Awaited<
  ReturnType<(typeof client)["storefront"]["orders"]["get"]>
>["data"];

export type ProductPageVariant = Awaited<
  ReturnType<ReturnType<(typeof client)["admin"]["product-variants"]>["get"]>
>["data"];

export const load: PageLoad = async ({
  params,
}: {
  params: { handle: string };
}) => {
  const handle = params.handle
    ? decodeURIComponent(String(params.handle)).trim()
    : "";

  if (!handle) {
    return { error: "No order handle provided", order: null, variants: [] };
  }

  const res = await client.storefront["orders"].get({
    query: { search: handle, limit: "1" },
  });
  const order = res.data?.rows?.[0];

  if (!order) {
    return { error: "Order not found", order: null, variants: [] };
  }

  const variantRes = await client.admin["product-variants"].get({
    query: { filters: { product_id: order.product_id }, limit: "100" },
  });

  const otherProductsRes = await client.storefront["products"].get({
    query: { limit: "4" },
  });

  return {
    order,
    variantRows: (variantRes.data?.rows ?? []) as ProductPageVariant[],
    otherProducts: otherProductsRes.data?.rows ?? [],
    error: null,
  };
};
