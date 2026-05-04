<script lang="ts">
	export type VariantItem = { id: string; title: string; priceDisplay: string };

	let {
		variants = [],
		selectedVariantId = $bindable(null as string | null)
	}: {
		variants: VariantItem[];
		selectedVariantId?: string | null;
	} = $props();
	const selectedVariant = $derived(variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null);
	const sizePattern = /^(xxs|xs|s|m|l|xl|xxl|xxxl|[0-9]{1,2})$/i;

	function splitVariantTitle(title: string): { size: string; color: string | null } {
		const parts = title
			.split(/[\/|-]/g)
			.map((part) => part.trim())
			.filter(Boolean);

		if (parts.length === 0) return { size: title, color: null };
		if (parts.length === 1) return { size: parts[0], color: null };

		const sizePart = parts.find((part) => sizePattern.test(part)) ?? parts[0];
		const colorPart = parts.find((part) => part !== sizePart) ?? null;
		return { size: sizePart, color: colorPart };
	}

	const normalizedVariants = $derived(
		variants.map((variant) => {
			const parsed = splitVariantTitle(variant.title);
			return {
				...variant,
				size: parsed.size,
				color: parsed.color
			};
		})
	);

	const colors = $derived(
		[...new Set(normalizedVariants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))]
	);

	const activeColor = $derived(selectedVariant ? splitVariantTitle(selectedVariant.title).color : (colors[0] ?? null));

	const visibleSizeVariants = $derived(
		activeColor
			? normalizedVariants.filter((variant) => variant.color === activeColor)
			: normalizedVariants
	);

</script>

{#if variants.length > 0}
	<div class="product-options">
		{#if colors.length > 0}
			<div class="option-group">
				<span class="option-label">Select Color</span>
				<div class="option-buttons color-list">
					{#each colors as color}
						<button
							type="button"
							class="option-btn color-btn"
							class:selected={activeColor === color}
							onclick={() => {
								const firstMatching = normalizedVariants.find((variant) => variant.color === color);
								if (firstMatching) selectedVariantId = firstMatching.id;
							}}
						>
							{color}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="option-group">
			<span class="option-label">Select Size</span>
			<div class="option-buttons variant-list">
				{#each visibleSizeVariants as v}
					<button
						type="button"
						class="option-btn"
						class:selected={selectedVariant?.id === v.id}
						onclick={() => (selectedVariantId = v.id)}
					>
						{v.size}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

