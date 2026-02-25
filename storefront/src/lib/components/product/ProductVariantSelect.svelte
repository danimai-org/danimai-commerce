<script lang="ts">
	export type VariantItem = { id: string; title: string; priceDisplay: string };

	let {
		variants = [],
		selectedVariantId = $bindable(null as string | null)
	}: {
		variants: VariantItem[];
		selectedVariantId?: string | null;
	} = $props();
</script>

{#if variants.length > 0}
	<div class="product-options">
		<div class="option-group">
			<span class="option-label">Variant</span>
			<div class="option-buttons variant-list">
				{#each variants as v}
					<button
						type="button"
						class="option-btn"
						class:selected={selectedVariantId === v.id}
						onclick={() => (selectedVariantId = v.id)}
					>
						{v.title} — {v.priceDisplay}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.product-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.option-label {
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #555;
		font-weight: 600;
	}
	.option-buttons.variant-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.option-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		background: #fff;
		font-size: 0.875rem;
		cursor: pointer;
		border-radius: 4px;
		text-align: left;
	}
	.option-btn.selected {
		border-color: #1a1a1a;
		background: #1a1a1a;
		color: #fff;
	}
</style>
