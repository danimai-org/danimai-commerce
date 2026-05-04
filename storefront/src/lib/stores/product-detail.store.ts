const productDetailStore = $state({
  selectedImageIndex: 0,
  selectedVariantId: null as string | null,
  priceValue: null as number | null,
})


export const updateSelectedImageIndex = (index: number) => {
  productDetailStore.selectedImageIndex = index
}

export const updateSelectedVariantId = (variantId: string | null) => {
  productDetailStore.selectedVariantId = variantId
  productDetailStore.priceValue = null
}
