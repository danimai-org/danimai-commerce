import type { PageLoad } from "./$types";
import { client } from "$lib/api/client.js";
import type {
	StorefrontProductDetail,
	StorefrontProductListRow,
	StorefrontProductVariant,
} from "$lib/types/product";

export type ProductPageProduct = StorefrontProductDetail;
export type ProductPageVariant = StorefrontProductVariant;
export type ProductPageMedia = NonNullable<StorefrontProductDetail["media"]>[number];

export type ProductPageData = {
	error: string | null;
	product: ProductPageProduct | null;
	variantRows: ProductPageVariant[];
	otherProducts: StorefrontProductListRow[];
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

	const product = res.data;
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
