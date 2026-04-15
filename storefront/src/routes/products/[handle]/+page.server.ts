import { client } from "$lib/api/client.js";
import type { PageLoad } from "./$types";
export const load: PageLoad = async ({ params }: { params: { handle: string } }) => {
  const handle = params.handle;
  const product = await client.storefront["products"].get({ query: { search: handle, limit: "1" } });
  return { product: product.data };
};
export type ProductPageProduct = Awaited<
  ReturnType<(typeof client)["storefront"]["products"]["get"]>
>["data"];

export type ProductPageVariant = Awaited<
  ReturnType<ReturnType<(typeof client)["admin"]["product-variants"]>["get"]>
>["data"];
