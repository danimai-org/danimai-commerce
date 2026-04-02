<script lang="ts">
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { DropdownMenu } from 'bits-ui';
	import { getDetailContext } from '$lib/hooks';
	import { getPriceListUpdateFormContext } from '$lib/hooks/price-list-edit-context';
	import { cn } from '$lib/utils.js';
	import { EditPriceList } from '$lib/components/organs/index.js';
	import { page } from '$app/state';

	type PriceList = {
		id: string;
		name: string;
		description: string | null;
		type: 'sale' | 'override';
		status: 'active' | 'draft';
		starts_at: string | null;
		ends_at: string | null;
		metadata: unknown | null;
	};

	const priceListUpdateForm = getPriceListUpdateFormContext();

	let editOpen = $state(false);

	const detailQuery = getDetailContext<PriceList>();
	const priceList = $derived(detailQuery?.data ?? null);

	$effect(() => {
		const shouldOpen = page.url.searchParams.get('edit') === 'true';
		if (shouldOpen) editOpen = true;
	});

	const priceOverridesCount = $derived.by(() => {
		const meta = priceList?.metadata as Record<string, unknown> | null;
		if (!meta) return null;

		// Price list metadata isn't strongly typed; we attempt a few common keys.
		const candidateKeys = [
			'price_overrides_count',
			'priceOverridesCount',
			'overrides_count',
			'overridesCount',
			'rules_count',
			'rulesCount'
		];

		for (const key of candidateKeys) {
			const raw = meta[key];
			if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
			if (typeof raw === 'string' && raw.trim().length > 0) {
				const n = Number(raw);
				if (Number.isFinite(n)) return n;
			}
		}

		return null;
	});
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-start justify-between gap-4">
		<div class="flex flex-col gap-1">
			<p class="text-xs font-medium text-muted-foreground">code</p>
			<h1 class="text-lg font-semibold">{priceList?.name ?? '—'}</h1>
		</div>

		<div class="flex items-center gap-2">
			<span
				class={cn(
					'inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium',
					priceList?.status === 'active'
						? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
						: 'bg-muted text-muted-foreground'
				)}
			>
				<span
					class={cn(
						'size-1.5 shrink-0 rounded-full',
						priceList?.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/60'
					)}
					aria-hidden="true"
				></span>
				{priceList?.status === 'active' ? 'Active' : 'Draft'}
			</span>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
					aria-label="Actions"
				>
					<MoreHorizontal class="size-4" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
						sideOffset={4}
					>
						<DropdownMenu.Item
							textValue="Edit"
							class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={() => (editOpen = true)}
						>
							<Pencil class="size-4" />
							Edit
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	</div>

	<div class="mt-5 flex flex-col gap-4">
		<div class="flex items-baseline justify-between gap-4 border-b pb-3">
			<span class="text-sm text-muted-foreground">Type</span>
			<span class="text-sm font-medium capitalize">{priceList?.type ?? '—'}</span>
		</div>

		<div class="flex items-baseline justify-between gap-4 border-b pb-3">
			<span class="text-sm text-muted-foreground">Description</span>
			<span class="max-w-[55%] truncate text-sm">{priceList?.description ?? '—'}</span>
		</div>

		<div class="flex items-baseline justify-between gap-4">
			<span class="text-sm text-muted-foreground">Price overrides</span>
			<span class="text-sm font-medium"
				>{priceOverridesCount != null ? priceOverridesCount : '—'}</span
			>
		</div>
	</div>

	{#if priceList}
		<EditPriceList
			bind:open={editOpen}
			{priceListUpdateForm}
			list={priceList}
			onSuccess={() => {
				void detailQuery?.refetch();
			}}
		/>
	{/if}
</div>
