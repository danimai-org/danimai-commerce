<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { SvelteSet } from 'svelte/reactivity';

	type ProductOption = {
		id: string;
		title: string;
		product_id: string | null;
		values?: Array<{ id?: string; value?: string }>;
	};

	type ProductVariant = {
		id: string;
		title: string;
		sku: string | null;
		product_id: string | null;
	};

	let {
		options = [],
		variants = [],
		onEditOptions = () => {}
	}: {
		options?: ProductOption[];
		variants?: ProductVariant[];
		onEditOptions?: () => void;
	} = $props();

	const optionsWithValues = $derived.by(() => {
		if (options.length === 0) return [] as { option: ProductOption; values: string[] }[];
		return options.map((opt, optIndex) => {
			const valuesSet = new SvelteSet<string>();
			if (Array.isArray(opt.values) && opt.values.length > 0) {
				for (const value of opt.values) {
					const normalized = (value?.value ?? '').trim();
					if (normalized) valuesSet.add(normalized);
				}
			}
			if (valuesSet.size === 0) {
				if (options.length === 1) {
					variants.forEach((variant) => {
						if (variant.title?.trim()) valuesSet.add(variant.title.trim());
					});
				} else {
					variants.forEach((variant) => {
						const parts = (variant.title ?? '')
							.split('/')
							.map((part) => part.trim())
							.filter(Boolean);
						if (parts[optIndex]) valuesSet.add(parts[optIndex]);
					});
				}
			}
			return { option: opt, values: Array.from(valuesSet) };
		});
	});
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Options</h2>

		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={onEditOptions}
			aria-label="Edit options"
		>
			<Pencil class="size-4" />
		</Button>
	</div>

	{#if optionsWithValues.length === 0}
		<p class="mt-4 text-sm text-muted-foreground">No options defined.</p>
	{:else}
		<div class="mt-4 flex flex-col gap-4">
			{#each optionsWithValues as { option: opt, values: vals } (opt.id)}
				<div>
					<p class="text-sm font-medium text-muted-foreground">{opt.title}</p>
					<div class="mt-1.5 flex flex-wrap gap-1.5">
						{#each vals as val (val)}
							<span
								class="inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 text-sm"
							>
								{val}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
