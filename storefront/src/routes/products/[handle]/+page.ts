import type { PageLoad } from "./$types";
import { client } from "$lib/api/client.js";

export type ProductPageMedia = {
  id: string;
  url: string;
  rank: number;
};

export type ProductPageVariant = {
  id: string;
  title: string;
  sku: string | null;
  thumbnail: string | null;
  variant_rank: number | null;
  options: Array<{ id: string; title: string; value: string; rank: number }>;
  prices: Array<{
    amount: string;
    currency_code: string;
    min_quantity: number | null;
    max_quantity: number | null;
    price_list_id: string | null;
  }>;
};

export type ProductPageProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  description: string | null;
  media: ProductPageMedia[];
  variant: {
    id: string;
    title: string;
    sku: string | null;
    thumbnail: string | null;
    variant_rank: number | null;
    price: {
      amount: string;
      currency_code: string;
      min_quantity: number | null;
      max_quantity: number | null;
      price_list_id: string | null;
    } | null;
  } | null;
  variants: ProductPageVariant[];
};

type ProductListItem = NonNullable<
  Awaited<ReturnType<(typeof client)["storefront"]["products"]["get"]>>["data"]
>["rows"][number];

export type ProductPageData = {
  error: string | null;
  product: ProductPageProduct | null;
  variantRows: ProductPageVariant[];
  otherProducts: ProductListItem[];
};

export const load: PageLoad = async ({
  params,
}): Promise<ProductPageData> => {
  const handle = params.handle
    ? decodeURIComponent(String(params.handle)).trim()
    : "";

  if (!handle) {
    return {
      error: "No product handle provided",
      product: null,
      variantRows: [],
      otherProducts: [],
    };
  }

  const res = await client.storefront.products({ handle }).get();

  if (res.error || !res.data) {
    return {
      error: "Product not found",
      product: null,
      variantRows: [],
      otherProducts: [],
    };
  }

  const product = res.data as ProductPageProduct;
  const otherProductsRes = await client.storefront.products.get({
    query: { limit: "4" },
  });

  return {
    product,
    variantRows: product.variants ?? [],
    otherProducts: (otherProductsRes.data?.rows ?? []).filter(
      (item) => item?.handle !== product.handle,
    ),
    error: null,
  };
};
