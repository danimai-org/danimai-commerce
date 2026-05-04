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
