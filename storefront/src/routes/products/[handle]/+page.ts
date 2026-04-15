import type { PageLoad } from "./$types";
import { client } from "$lib/api/client.js";

export type ProductPageProduct = Awaited<
  ReturnType<(typeof client)["storefront"]["products"]["get"]>
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
    return { error: "No product handle provided", product: null, variants: [] };
  }

  const res = await client.storefront["products"].get({
    query: { search: handle, limit: "1" },
  });
  const product = res.data?.rows?.[0];

  if (!product) {
    return { error: "Product not found", product: null, variants: [] };
  }

  const variantRes = await client.admin["product-variants"].get({
    query: { filters: { product_id: product.id }, limit: "100" },
  });

  const otherProductsRes = await client.storefront["products"].get({
    query: { limit: "4" },
  });

  return {
    product,
    variantRows: (variantRes.data?.rows ?? []) as ProductPageVariant[],
    otherProducts: otherProductsRes.data?.rows ?? [],
    error: null,
  };
};
