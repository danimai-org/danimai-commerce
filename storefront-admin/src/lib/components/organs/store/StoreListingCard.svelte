<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { DropdownMenu } from 'bits-ui';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import EditStore from '$lib/components/organs/store/EditStore.svelte';
	import { client } from '$lib/client.js';
	import { page } from '$app/state';
	import { createPagination, type PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	type Store = {
		id: string;
		name: string;
		default_currency_code: string | null;
		default_sales_channel_id: string | null;
		default_region_id: string | null;
		default_location_id: string | null;
		metadata: unknown | null;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
	};

	function parsePositiveInt(raw: string | null, fallback: number) {
		const n = Number.parseInt(raw ?? '', 10);
		return Number.isFinite(n) && n > 0 ? n : fallback;
	}

	/** Eden returns `{ data: body }`; TanStack may expose the body once — support both. */
	function unwrapPaginatedBody<T>(res: unknown): { rows: T[]; pagination: PaginationMeta } | null {
		if (res == null || typeof res !== 'object') return null;
		const o = res as Record<string, unknown>;
		const inner = o.data;
		if (inner != null && typeof inner === 'object' && inner !== null && 'rows' in inner) {
			return inner as { rows: T[]; pagination: PaginationMeta };
		}
		if ('rows' in o) {
			return o as { rows: T[]; pagination: PaginationMeta };
		}
		return null;
	}

	const paginateState = createPagination(
		async () => {
			const res = await client.stores.get({
				query: {
					page: parsePositiveInt(page.url.searchParams.get('page'), 1),
					limit: parsePositiveInt(page.url.searchParams.get('limit'), 10)
				}
			});
			return unwrapPaginatedBody<Store>(res);
		},
		['stores'],
		undefined,
		{ keySuffix: () => [page.url.searchParams.toString()] }
	);

	const listPayload = $derived(unwrapPaginatedBody<Store>(paginateState.query.data));
	const pagination = $derived(listPayload?.pagination ?? null);
	const rowsRaw = $derived((listPayload?.rows ?? []) as Store[]);

	let search = $state('');

	const rows = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return rowsRaw;
		return rowsRaw.filter((r) => r.name?.toLowerCase().includes(q));
	});

	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);

	const count = $derived(pagination?.total ?? 0);
	const pageNum = $derived(pagination?.page ?? 1);
	const totalPages = $derived(Math.max(1, pagination?.total_pages ?? 1));
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	function goToPage(nextPage: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, nextPage)));

		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	let editStoreOpen = $state(false);

	let storeToEdit = $state<Store | null>(null);

	function handleEditStore(row: Store) {
		storeToEdit = row;
		editStoreOpen = true;
	}
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b p-4">
		<h2 class="font-semibold">Stores</h2>
		<div class="flex items-center gap-2">
			<Button size="sm" variant="outline">
				<SlidersHorizontal class="mr-2 size-4" />
				Sort
			</Button>
			<div class="relative">
				<Search
					class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input class="h-9 w-56 pl-8" placeholder="Search" bind:value={search} />
			</div>
		</div>
	</div>

	<div class="overflow-auto p-4">
		<table class="w-full text-left text-sm">
			<thead class="border-b bg-muted/20">
				<tr>
					<th class="px-4 py-3 font-medium">Name</th>
					<th class="px-4 py-3 font-medium">Default currency</th>
					<th class="px-4 py-3 font-medium">Default region</th>
					<th class="px-4 py-3 font-medium">Default sales channel</th>
					<th class="px-4 py-3 font-medium">Default location</th>
					<th class="px-4 py-3 text-right font-medium">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if loading && rows.length === 0}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-muted-foreground">Loading…</td>
					</tr>
				{:else if error}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-destructive">{error}</td>
					</tr>
				{:else if rows.length === 0}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-muted-foreground">
							{search.trim() ? 'No matching stores.' : 'No stores found.'}
						</td>
					</tr>
				{:else}
					{#each rows as row (row.id)}
						<tr class="border-b transition-colors last:border-b-0 hover:bg-muted/50">
							<td class="px-4 py-3 font-medium">{row.name}</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.default_currency_code?.toUpperCase() ?? '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.default_region_id ?? '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.default_sales_channel_id ?? '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.default_location_id ?? '—'}
							</td>
							<td class="px-4 py-3 text-right">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
									>
										<MoreHorizontal class="size-4" />
										<span class="sr-only">Actions</span>
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content
											class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
											sideOffset={4}
										>
											<DropdownMenu.Item
												class="relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground"
												onSelect={() => handleEditStore(row)}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if count > 0}
		<div class="flex items-center justify-between gap-4 border-t px-4 py-3">
			<p class="text-sm text-muted-foreground">{start} - {end} of {count} results</p>
			<div class="flex items-center gap-2">
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(pageNum - 1)}
					disabled={pageNum <= 1 || loading}
				>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">{pageNum} of {totalPages}</span>
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(pageNum + 1)}
					disabled={pageNum >= totalPages || loading}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div>

<EditStore
	bind:open={editStoreOpen}
	store={storeToEdit}
	onSuccess={() => paginateState.refetch()}
/>
