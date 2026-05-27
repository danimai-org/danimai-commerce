<script lang="ts">
    let {
        images = [],
        selectedImageIndex = $bindable(0),
        alt = "",
    }: {
        images: string[];
        selectedImageIndex: number;
        alt?: string;
    } = $props();

    const displayImage = $derived(images[selectedImageIndex] || "");
    const imageAlt = $derived(alt.trim() || "Product image");
</script>

<div class="product-gallery">
    {#if images.length > 0}
        <div class="product-thumbnails" aria-label="Product images">
            {#each images as src, i}
                <button
                    type="button"
                    class="thumb"
                    class:selected={i === selectedImageIndex}
                    aria-label="View image {i + 1} of {images.length}"
                    aria-current={i === selectedImageIndex ? "true" : undefined}
                    onclick={() => {
                        selectedImageIndex = i;
                    }}
                >
                    <img {src} alt="" />
                </button>
            {/each}
        </div>
        <div class="product-main-image" style="background-color: #f5f0eb;">
            <img src={displayImage} alt={imageAlt} />
        </div>
    {:else}
        <div
            class="product-main-image product-main-image-empty"
            style="background-color: #f5f0eb;"
            aria-label="No product image available"
        ></div>
    {/if}
</div>
