<script lang="ts">
    let {
        images = [],
        selectedImageIndex = $bindable(0),
    }: {
        images: string[];
        selectedImageIndex: number;
    } = $props();

    const displayImage = $derived(images[selectedImageIndex] || "");
</script>

<div class="product-gallery">
    <div class="product-main-image" style="background-color: #f5f0eb;">
        {#if displayImage}
            <img src={displayImage} alt="" />
        {/if}
    </div>
    {#if images.length > 1}
        <div class="product-thumbnails">
            {#each images.slice(0, 8) as src, i}
                <button
                    type="button"
                    class="thumb"
                    class:selected={i === selectedImageIndex}
                    aria-label="View image"
                    onclick={() => {
                        selectedImageIndex = i;
                    }}
                >
                    <img {src} alt="" />
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .product-gallery {
        position: sticky;
        top: 140px;
    }
    .product-main-image {
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1rem;
        background: #f5f0eb;
    }
    .product-main-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
    }
    .product-thumbnails {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
    }
    .thumb {
        aspect-ratio: 1;
        border: 2px solid transparent;
        border-radius: 6px;
        overflow: hidden;
        background: #eee;
        cursor: pointer;
        padding: 0;
    }
    .thumb.selected {
        border-color: #1a1a1a;
    }
    .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    @media (max-width: 900px) {
        .product-gallery {
            position: static;
        }
    }
</style>
