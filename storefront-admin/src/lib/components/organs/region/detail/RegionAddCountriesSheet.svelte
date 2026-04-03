<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import { cn } from '$lib/utils.js';
	import { SvelteSet } from 'svelte/reactivity';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';

	let {
		open = $bindable(false),
		preselectedIds = [] as string[],
		excludeIds = [] as string[],
		onPick
	} = $props<{
		open?: boolean;
		/** Restored selection when reopening (e.g. create-region flow). */
		preselectedIds?: string[];
		/** ISO codes already in the region — hidden from the list (e.g. region detail). */
		excludeIds?: string[];
		onPick?: (ids: string[]) => void;
	}>();

	let search = $state('');

	const listQuery = { page: 1, limit: 100 } as const;
	const countriesQuery = createQuery(() => ({
		queryKey: ['add-region-countries', listQuery.page, listQuery.limit, search.trim()],
		queryFn: () =>
			client['regions'].countries.get({
				query: {
					page: listQuery.page,
					limit: listQuery.limit,
					search: search.trim()
				}
			}),
		enabled: open
	}));

	type CountryRow = { id: string; name: string; code: string };
	type CountryApiRow = {
		id: string;
		iso_2: string;
		name?: string;
		display_name?: string;
	};

	const apiRows = $derived.by((): CountryRow[] =>
		(countriesQuery.data?.data?.rows ?? []).map((row: CountryApiRow) => ({
			id: String(row.id),
			name: String(row.display_name ?? row.name ?? '').trim() || String(row.iso_2).toUpperCase(),
			code: String(row.iso_2).toUpperCase()
		}))
	);

	const rows = $derived.by((): CountryRow[] => {
		const excluded = new Set(excludeIds.map((x: string) => String(x).toUpperCase()));
		return apiRows.filter((r) => !excluded.has(r.code));
	});

	const loading = $derived(countriesQuery.isPending);

	let selectedIds = new SvelteSet<string>();

	const allRowsSelected = $derived(
		rows.length > 0 && rows.every((c) => selectedIds.has(c.code))
	);

	$effect(() => {
		if (!open) {
			search = '';
			selectedIds.clear();
			return;
		}
		search = '';
		selectedIds.clear();
		for (const id of preselectedIds) {
			selectedIds.add(String(id).toUpperCase());
		}
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex h-full w-full flex-col sm:max-w-lg">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>Add countries</Sheet.Title>
			<Sheet.Description>Select unassigned countries to add to this region.</Sheet.Description>
		</Sheet.Header>

		<div class="border-b px-6 py-3">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search by name or ISO code..."
					bind:value={search}
					class="h-9 rounded-md bg-background pl-9"
				/>
			</div>
		</div>

		<div class="min-h-0 flex-1 overflow-auto">
			{#if loading}
				<div class="flex min-h-[12rem] items-center justify-center px-6 py-12">
					<p class="text-center text-sm text-muted-foreground">Loading countries…</p>
				</div>
			{:else if rows.length === 0}
				<div class="flex min-h-[12rem] items-center justify-center px-6 py-12">
					<p class="text-center text-sm text-muted-foreground">No countries match your search.</p>
				</div>
			{:else}
				<table class="w-full text-sm">
					<thead
						class="sticky top-0 z-10 border-b bg-card text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase shadow-sm"
					>
						<tr>
							<th class="w-12 py-3.5 pr-2 pl-6 align-middle">
								<input
									type="checkbox"
									checked={allRowsSelected}
									onchange={() => {
										if (allRowsSelected) {
											selectedIds.clear();
										} else {
											for (const c of rows) {
												selectedIds.add(c.code);
											}
										}
									}}
									class="size-4 cursor-pointer rounded border-input accent-primary"
								/>
							</th>
							<th class="py-3.5 pr-4 align-middle">Country</th>
							<th class="py-3.5 pr-6 align-middle">Code</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each rows as c (c.code)}
							<tr class={cn('transition-colors hover:bg-muted/30')}>
								<td class="py-3.5 pr-2 pl-6 align-middle">
									<input
										type="checkbox"
										checked={selectedIds.has(c.code)}
										onchange={() => {
											if (selectedIds.has(c.code)) {
												selectedIds.delete(c.code);
											} else {
												selectedIds.add(c.code);
											}
										}}
										class="size-4 cursor-pointer rounded border-input accent-primary"
									/>
								</td>
								<td class="py-3.5 pr-4 align-middle leading-snug font-medium">
									<span class="align-middle">{c.name}</span>
								</td>
								<td class="py-3.5 pr-6 align-middle">
									<span
										class="inline-block rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-bold uppercase"
									>
										{c.code}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

		<Sheet.Footer class="mt-auto flex shrink-0 justify-end gap-2 border-t bg-card p-4">
			<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				type="button"
				disabled={selectedIds.size === 0}
				onclick={() => {
					onPick?.(Array.from(selectedIds).map(String));
					open = false;
				}}
			>
				Add selected
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
