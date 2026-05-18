<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditProductSheet from './EditProductSheet.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { getDetailContext } from '$lib/hooks';
	import type { Product } from '../type';

	type ProductUpdateFormData = {
		id: string;
		status: 'draft' | 'proposed' | 'published' | 'rejected';
		title: string;
		subtitle: string;
		handle: string;
		description: string;
		discountable: boolean;
	};

	let {
		productUpdateForm
	}: {
		productUpdateForm: SuperValidated<ProductUpdateFormData>;
	} = $props();

	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);

	let editSheetOpen = $state(false);

	const handleDisplay = $derived(
		(product as { handle?: string } | null)?.handle
			? (product as { handle?: string } | null)?.handle?.startsWith('/')
				? (product as { handle?: string } | null)?.handle
				: `/${(product as { handle?: string } | null)?.handle}`
			: '—'
	);
</script>

<div class="min-w-0 self-start rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-4">
		<div class="flex items-start justify-between gap-4 sm:items-center">
			<h1 class="min-w-0 flex-1 text-xl font-semibold tracking-tight sm:text-2xl">
				{(product as { title?: string } | null)?.title ?? '—'}
			</h1>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={() => (editSheetOpen = true)}
				aria-label="Edit product"
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>
	<div class="rounded-lg bg-card pt-6 pr-6 pb-6 pl-0">
		<dl class="mt-0 grid gap-3 text-sm">
			<div
				class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
			>
				<dt class="shrink-0 font-medium text-muted-foreground">Description</dt>
				<dd class="min-w-0 break-words text-left sm:text-right">
					{(product as { description?: string } | null)?.description ?? '—'}
				</dd>
			</div>
			<div
				class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
			>
				<dt class="shrink-0 font-medium text-muted-foreground">Handle</dt>
				<dd class="min-w-0 break-words text-left sm:text-right">{handleDisplay}</dd>
			</div>
			<div
				class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
			>
				<dt class="shrink-0 font-medium text-muted-foreground">Discountable</dt>
				<dd class="min-w-0 break-words text-left sm:text-right">
					{(product as { discountable?: boolean } | null)?.discountable === true
						? 'True'
						: (product as { discountable?: boolean } | null)?.discountable === false
							? 'False'
							: '—'}
				</dd>
			</div>
		</dl>
	</div>
</div>

<EditProductSheet
	bind:open={editSheetOpen}
	{productUpdateForm}
	onSaved={() => void detailQuery?.refetch?.()}
/>
