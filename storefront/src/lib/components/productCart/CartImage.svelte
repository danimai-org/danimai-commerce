<script lang="ts">
    type CartImageVariant = "retail" | "feature";

    let {
        image,
        title,
        bg = "#ffffff",
        variant = "retail",
    }: {
        image: string | null;
        title: string;
        bg?: string;
        variant?: CartImageVariant;
    } = $props();
</script>

<div
    class={`product-image-wrap ${variant}`}
    style:background-color={image ? "#ffffff" : bg}
>
    {#if image}
        <img src={image} alt={title} class={`product-image ${variant}`} />
    {:else}
        <div class="product-image-placeholder" aria-hidden="true"></div>
    {/if}
</div>

<style>
    .product-image-wrap {
        overflow: hidden;
    }
    .product-image-wrap.retail {
        aspect-ratio: 1;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .product-image-wrap.feature {
        aspect-ratio: 4 / 5;
        border-radius: 10px;
        background: #f5f0eb;
    }
    .product-image {
        width: 100%;
        height: 100%;
        display: block;
    }
    .product-image.retail {
        object-fit: contain;
        padding: 0.75rem;
        box-sizing: border-box;
    }
    .product-image.feature {
        object-fit: cover;
    }
    .product-image-placeholder {
        width: 100%;
        height: 100%;
        background: #e8e8e8;
    }
</style>
