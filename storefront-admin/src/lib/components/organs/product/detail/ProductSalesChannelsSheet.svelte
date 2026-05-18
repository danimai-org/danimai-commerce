<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import { cn } from '$lib/utils.js';
	import { SvelteSet } from 'svelte/reactivity';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';

	export type SalesChannel = { id: string; name: string; title?: string; is_default?: boolean };
	type Props = {
		open: boolean;
		selectedIds?: SvelteSet<string>;
		onSelectedIdsChange: (set: SvelteSet<string>) => void;
		onSave: () => void;
		onCancel: () => void;
		submitting: boolean;
	};

	let {
		open = $bindable(false),
		selectedIds = new SvelteSet<string>(),
		onSelectedIdsChange,
		onSave,
		onCancel,
		submitting = false
	}: Props = $props();

	const SEARCH_DEBOUNCE_MS = 300;

	let searchQuery = $state('');
	let debouncedSearch = $state('');

	$effect(() => {
		if (!open) return;
		searchQuery = '';
		debouncedSearch = '';
	});

	$effect(() => {
		const s = searchQuery;
		const tid = setTimeout(() => {
			debouncedSearch = s.trim();
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(tid);
	});

	const channelsQuery = createQuery(() => ({
		queryKey: ['sales-channels', 'product-sales-sheet', debouncedSearch],
		queryFn: () =>
			client['sales-channels'].get({
				query: {
					page: '1',
					limit: '100',
					sorting_field: 'sales_channels.name',

					...(debouncedSearch ? { search: debouncedSearch } : {})
				}
			}),
		enabled: () => open,
		refetchOnWindowFocus: false
	}));

	const filteredChannels = $derived.by((): SalesChannel[] => {
		const res = channelsQuery.data;
		const payload = res?.data as
			| { rows?: Array<{ id: string; name?: string; is_default?: boolean }> }
			| undefined;
		const rows = payload?.rows ?? [];
		return rows.map((ch) => ({
			id: ch.id,
			name: ch.name ?? '',
			is_default: ch.is_default
		}));
	});

	const listLoading = $derived(open && (channelsQuery.isPending || channelsQuery.isFetching));
	const listError = $derived(
		channelsQuery.error != null
			? channelsQuery.error instanceof Error
				? channelsQuery.error.message
				: String(channelsQuery.error)
			: null
	);

	function toggle(channel: SalesChannel) {
		const newSet = new SvelteSet(selectedIds);
		if (newSet.has(channel.id)) {
			newSet.delete(channel.id);
		} else {
			newSet.add(channel.id);
		}
		selectedIds = newSet;
		onSelectedIdsChange(newSet);
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Sales Channels</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Select which sales channels this product should be available in.
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="relative">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search sales channels"
							bind:value={searchQuery}
							class="h-9 rounded-md pl-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						{#if listError}
							<p class="py-8 text-center text-sm text-destructive">{listError}</p>
						{:else if listLoading}
							<p class="py-8 text-center text-sm text-muted-foreground">Loading…</p>
						{:else if filteredChannels.length === 0}
							<p class="py-8 text-center text-sm text-muted-foreground">No sales channels found.</p>
						{:else}
							{#each filteredChannels as channel (channel.id)}
								<div class="flex items-center justify-between rounded-md border p-3">
									<div class="flex flex-col gap-1">
										<span class="text-sm font-medium">{channel.title ?? channel.name}</span>
										{#if channel.is_default}
											<span class="text-xs text-muted-foreground">Default</span>
										{/if}
									</div>
									<button
										type="button"
										role="switch"
										aria-checked={selectedIds.has(channel.id)}
										aria-label="Toggle {channel.name}"
										class={cn(
											'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
											selectedIds.has(channel.id) ? 'bg-primary' : 'bg-input'
										)}
										onclick={() => toggle(channel)}
									>
										<span
											class={cn(
												'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
												selectedIds.has(channel.id) ? 'translate-x-5' : 'translate-x-[1px]'
											)}
										></span>
									</button>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>
				<Button onclick={onSave} disabled={submitting}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
