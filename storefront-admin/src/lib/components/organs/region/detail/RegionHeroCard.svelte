<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';

	import EditRegion from '$lib/components/organs/region/update/edit-region.svelte';
	import { getDetailContext } from '$lib/hooks';
	import type { Region } from '../type';
	import { client } from '$lib/client.js';

	let formSheetOpen = $state(false);

	const detailQuery = getDetailContext<Region>();
	const region = $derived(detailQuery?.data ?? null);

	let currencyData = $state<{ name: string; tax_inclusive_pricing: boolean } | null>(null);
	let currencyLoading = $state(false);
	let currencyError = $state<string | null>(null);

	const currencyLabel = $derived.by(() => {
		if (currencyData)
			return `${region?.currency_code?.toUpperCase() ?? ''} ${currencyData?.name ?? '—'}`;
		return region?.currency_code?.toUpperCase() ?? '—';
	});

	$effect(() => {
		const code = region?.currency_code?.trim();
		if (!code) {
			currencyData = null;
			currencyError = null;
			currencyLoading = false;
			return;
		}

		let cancelled = false;
		currencyLoading = true;
		currencyError = null;

		const codeUpper = code.toUpperCase();
		void client.currencies
			.get({ query: { search: code.toLowerCase(), limit: 100, page: 1 } })
			.then((res) => {
				if (cancelled) return;
				const rows = res.data?.rows ?? [];
				const row = rows.find((r) => r.code.toUpperCase() === codeUpper) ?? null;
				currencyData = row
					? { name: row.name, tax_inclusive_pricing: row.tax_inclusive_pricing }
					: null;
			})
			.catch((e) => {
				if (cancelled) return;
				currencyError = e instanceof Error ? e.message : String(e);
				currencyData = null;
			})
			.finally(() => {
				if (!cancelled) currencyLoading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{region?.name ?? '—'}</h1>
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
							onSelect={() => (formSheetOpen = true)}
						>
							<Pencil class="size-4" />
							Edit
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>

		<dl class="grid gap-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted-foreground">Currency</dt>
				<dd class="mt-1 font-medium">
					{#if currencyLoading}
						<span class="text-muted-foreground">Loading…</span>
					{:else if currencyError}
						<span class="text-destructive">{currencyError}</span>
					{:else}
						{currencyLabel}
					{/if}
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Tax inclusive pricing</dt>
				<dd class="mt-1 font-medium">
					{#if currencyLoading}
						<span class="text-muted-foreground">—</span>
					{:else}
						{(currencyData?.tax_inclusive_pricing ?? false) ? 'True' : 'False'}
					{/if}
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Automatic Taxes</dt>
				<dd class="mt-1 font-medium">
					{#if typeof (region as Record<string, unknown> | null)?.automatic_taxes === 'boolean'}
						{(region as Record<string, unknown>).automatic_taxes ? 'True' : 'False'}
					{:else}
						—
					{/if}
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Payment Providers</dt>
				<dd class="mt-1 font-medium">—</dd>
			</div>
		</dl>
	</section>
</div>
<EditRegion
	bind:open={formSheetOpen}
	{region}
	onSuccess={() => {
		void detailQuery?.refetch?.();
	}}
/>
