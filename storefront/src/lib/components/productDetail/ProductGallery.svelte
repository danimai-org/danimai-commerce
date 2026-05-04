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
