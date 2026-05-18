<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';

	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';
	import { SvelteMap } from 'svelte/reactivity';
	import { createQuery } from '@tanstack/svelte-query';

	let { open = $bindable(false), onSuccess = () => {} } = $props();

	let search = $state('');
	let debouncedSearch = $state('');
	let pageNum = $state(1);
	let addSubmitting = $state(false);

	let addSelected = $state(new Map<string, boolean>());

	$effect(() => {
		const q = search;
		if (debouncedSearch === q) return;
		const t = setTimeout(() => {
			debouncedSearch = q;
		}, 300);
		return () => clearTimeout(t);
	});

	$effect(() => {
		if (!open) {
			search = '';
			debouncedSearch = '';
			pageNum = 1;
		}
	});

	const searchStale = $derived(search.trim() !== debouncedSearch.trim());

	const availableQuery = createQuery(() => ({
		queryKey: ['currencies-available', pageNum, debouncedSearch.trim()],
		queryFn: async () => {
			const res = await client.currencies.available.get({
				query: {
					page: pageNum,
					limit: 100,
					...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {})
				}
			});
			if (res.error != null) {
				throw res.error;
			}
			return res.data;
		},
		enabled: () => open,
		refetchOnWindowFocus: false
	}));

	const listLoading = $derived(
		searchStale || availableQuery.isPending || availableQuery.isFetching
	);

	const availableList = $derived.by(() => {
		if (searchStale) return [];
		return availableQuery.data?.data ?? [];
	});
	const selectableList = $derived.by(() => {
		return availableList.filter((c) => !c.active);
	});
	const isAllSelected = $derived.by(() => {
		return selectableList.length > 0 && selectableList.every((c) => addSelected.has(c.code));
	});

	const toAdd = $derived.by(() => {
		return selectableList.filter((c) => addSelected.has(c.code));
	});

	const searchNoHits = $derived(
		debouncedSearch.trim().length > 0 &&
			!listLoading &&
			availableList.length === 0
	);

	const idleEmptyBrowse = $derived(
		debouncedSearch.trim().length === 0 && !listLoading && availableList.length === 0
	);

	function toggleAddSelectAll() {
		const next = new SvelteMap(addSelected);

		if (isAllSelected) {
			selectableList.forEach((c) => {
				next.delete(c.code);
			});
		} else {
			selectableList.forEach((c) => {
				next.set(c.code, c.tax_inclusive_pricing);
			});
		}

		addSelected = next;
	}

	function toggleCurrency(code: string, taxInclusive: boolean) {
		const next = new SvelteMap(addSelected);

		if (next.has(code)) {
			next.delete(code);
		} else {
			next.set(code, taxInclusive);
		}

		addSelected = next;
	}

	function updateTaxInclusive(code: string, value: boolean) {
		const next = new SvelteMap(addSelected);

		next.set(code, value);

		addSelected = next;
	}

	async function createCurrencies(payload: {
		currencies: {
			code: string;
			tax_inclusive_pricing: boolean;
		}[];
	}) {
		const res = await client.currencies.post(payload);
		if (res.error != null) {
			throw res.error;
		}
		return res.data;
	}

	async function submitAdd() {
		const payload = toAdd.map((c) => ({
			code: c.code,
			tax_inclusive_pricing: addSelected.get(c.code) ?? false
		}));

		if (payload.length === 0) return;

		addSubmitting = true;

		try {
			await createCurrencies({
				currencies: payload
			});

			open = false;

			onSuccess();
		} catch (e) {
			console.error('Failed to save currencies:', e);
		} finally {
			addSubmitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="border-b p-4">
				<h2 class="text-lg font-semibold">Add currencies</h2>

				<div class="relative mt-4">
					<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

					<Input
						type="search"
						placeholder="Search by code or name"
						bind:value={search}
						oninput={() => (pageNum = 1)}
						class="pl-9"
					/>
				</div>
			</div>

			<div class="flex-1 overflow-auto p-4">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="w-10 px-4 py-3">
								<input
									type="checkbox"
									checked={isAllSelected}
									onchange={toggleAddSelectAll}
									class="cursor-pointer"
								/>
							</th>

							<th class="px-4 py-3 text-left"> Code </th>

							<th class="px-4 py-3 text-left"> Name </th>

							<th class="px-4 py-3 text-left"> Tax inclusive </th>
						</tr>
					</thead>

					<tbody>
						{#if listLoading && availableList.length === 0}
							<tr>
								<td colspan="4" class="py-10 text-center text-muted-foreground">Loading…</td>
							</tr>
						{:else if idleEmptyBrowse}
							<tr>
								<td colspan="4" class="py-10 text-center text-muted-foreground">
									No currencies found
								</td>
							</tr>
						{:else if !searchNoHits}
							{#each availableList as item (item.code)}
								<tr class={cn('border-b hover:bg-muted/30', item.active && 'opacity-50 grayscale')}>
									<!-- select -->
									<td class="px-4 py-3">
										<input
											type="checkbox"
											disabled={item.active}
											checked={addSelected.has(item.code)}
											onchange={() => toggleCurrency(item.code, item.tax_inclusive_pricing)}
											class="cursor-pointer"
										/>
									</td>
									<td class="px-4 py-3 font-medium">
										{item.code}
									</td>

									<td class="px-4 py-3">
										{item.name}
									</td>

									<td class="px-4 py-3">
										<input
											type="checkbox"
											disabled={item.active || !addSelected.has(item.code)}
											checked={addSelected.get(item.code) ?? item.tax_inclusive_pricing}
											onchange={(e) => updateTaxInclusive(item.code, e.currentTarget.checked)}
										/>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<div class="flex items-center justify-between border-t p-4">
				<p class="text-sm text-muted-foreground">
					Selected: {toAdd.length}
				</p>

				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>

					<Button onclick={submitAdd} disabled={addSubmitting || toAdd.length === 0}>
						{addSubmitting ? 'Saving...' : 'Save Currencies'}
					</Button>
				</div>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
