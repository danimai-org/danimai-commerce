<script lang="ts">
	import ProductDetailVariantsSection from './ProductDetailVariantsSection.svelte';
	// import type { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	// const product = $derived(getProductDetail().data ?? null);

	
</script>

<ProductDetailVariantsSection
	variants={ []}
	options={ []}
	variantPricesMap={new Map<string, string>()}
	onEditVariant={() => {
	}}
	onDeleteVariant={() => {
		
	}}
	onEditOptionsAndVariants={() => {}}
/>

<!-- <ProductVariantsEditSheet
	bind:open={v.variantsEditSheetOpen}
	productId={product?.id ?? ''}
	product={product}
	options={product?.options ?? []}
	variants={product?.variants ?? []}
	loadProduct={() => Promise.resolve()}
	loadOptionsAndVariants={() => Promise.resolve()}
/> -->

<!-- <DeleteConfirmationModal
	bind:open={v.deleteVariantConfirmOpen}
	entityName="variant"
	entityTitle={v.variantToDelete()
		? `"${v.variantToDelete()!.title}"${v.variantToDelete()!.sku ? ` (SKU: ${v.variantToDelete()!.sku})` : ''}`
		: ''}
	onConfirm={v.confirmDeleteVariant}
	onCancel={v.closeDeleteVariantConfirm}
	submitting={v.deleteVariantSubmitting()}
/>

<ProductVariantImageSheet
	bind:open={v.variantImageSheetOpen}
	variantTitle={v.variantImageVariant()?.title ?? ''}
	imageUrl={v.variantImageUrl.get()}
	error={v.variantImageError()}
	submitting={v.variantImageSubmitting()}
	onImageUrlChange={(val) => v.variantImageUrl.set(val)}
	onCancel={() => {
		v.variantImageSheetOpen = false;
	}}
	onSave={v.saveVariantImage}
/> -->
