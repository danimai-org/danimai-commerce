<script lang="ts">
    import { applySelectedRegionToCart } from "$lib/cart/cart-state.svelte";
    import {
        getSelectedRegion,
        initRegionState,
        regionOptionLabel,
        regionState,
        setSelectedRegion,
    } from "$lib/region/region-state.svelte";

    let {
        id = "region",
        className = "",
        compact = false,
        variant = "default",
    }: {
        id?: string;
        className?: string;
        compact?: boolean;
        variant?: "default" | "header";
    } = $props();

    let switching = $state(false);

    const selectedRegion = $derived(getSelectedRegion());
    const regions = $derived(regionState.regions);

    $effect(() => {
        if (regionState.initialized || regionState.loading) return;
        void initRegionState();
    });

    async function handleChange(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        const regionId = target.value;
        if (!regionId || regionId === regionState.selectedRegionId) return;
        switching = true;
        try {
            setSelectedRegion(regionId);
            await applySelectedRegionToCart();
        } finally {
            switching = false;
        }
    }
</script>

{#if regions.length > 0}
    <div
        class="region-selector {className}"
        class:region-selector--compact={compact}
        class:region-selector--header={variant === "header"}
    >
        {#if !compact}
            <label for={id}>REGION</label>
        {/if}
        <select
            {id}
            name="region"
            class={variant === "header"
                ? "region-select--header"
                : compact
                  ? "region-select region-select--compact"
                  : "region-select footer-select"}
            value={selectedRegion?.id ?? ""}
            disabled={switching || regionState.loading}
            aria-label="Select region"
            onchange={handleChange}
        >
            {#each regions as region (region.id)}
                <option value={region.id}>{regionOptionLabel(region)}</option>
            {/each}
        </select>
    </div>
{/if}
