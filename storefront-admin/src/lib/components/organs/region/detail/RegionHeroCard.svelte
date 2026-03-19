<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { client } from '$lib/client.js';

	interface Props {
		region: { id: string; name: string; currency_code: string; metadata?: Record<string, unknown> };
		onEdit: () => void;
		onDelete: () => void;
	}

	let { region, onEdit, onDelete }: Props = $props();

	let currencyData = $state<{ name: string; tax_inclusive_pricing: boolean } | null>(null);
	let currencyLoading = $state(false);
	let currencyError = $state<string | null>(null);

	$effect(() => {
		const code = region.currency_code?.trim();
		if (!code) {
			currencyData = null;
			currencyError = null;
			return;
		}
		let cancelled = false;
		currencyLoading = true;
		currencyError = null;
		currencyData = null;
		client.currencies.list
			.get({ query: { code: code.toUpperCase() } })
			.then((res) => {
				if (cancelled) return;
				currencyLoading = false;
				if (res.error) {
					currencyError = String((res.error as { value?: { message?: string } })?.value?.message ?? res.error);
					return;
				}
				const raw = res.data as unknown;
				const rows = Array.isArray(raw) ? raw : (raw as { rows?: unknown[] })?.rows ?? [];
				const c = (rows[0] as { code?: string; name?: string; tax_inclusive_pricing?: boolean } | undefined);
				if (c) {
					currencyData = {
						name: c.name ?? code,
						tax_inclusive_pricing: c.tax_inclusive_pricing ?? false
					};
				} else {
					currencyData = { name: code, tax_inclusive_pricing: false };
				}
			})
			.catch((e) => {
				if (cancelled) return;
				currencyLoading = false;
				currencyError = e instanceof Error ? e.message : String(e);
			});
		return () => {
			cancelled = true;
		};
	});

	const currencyLabel = $derived.by(() => {
		if (currencyData) return `${region.currency_code?.toUpperCase() ?? ''} ${currencyData.name}`;
		return region.currency_code?.toUpperCase() ?? '—';
	});
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{region.name}</h1>
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
							class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={onEdit}
						>
							<Pencil class="size-4" />
							Edit
						</DropdownMenu.Item>
						<DropdownMenu.Item
							textValue="Delete"
							class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={onDelete}
						>
							<Trash2 class="size-4" />
							Delete
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
						{currencyData?.tax_inclusive_pricing ?? false ? 'True' : 'False'}
					{/if}
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Automatic Taxes</dt>
				<dd class="mt-1 font-medium">—</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Payment Providers</dt>
				<dd class="mt-1 font-medium">—</dd>
			</div>
		</dl>
	</section>
</div>
