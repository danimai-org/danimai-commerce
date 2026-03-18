<!-- <script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { client } from '$lib/client.js';
	import type { Product } from '$lib/components/organs/product/create/types.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { cn } from '$lib/utils.js';
	import {}

	interface Props {
		open?: boolean;
		categoryId: string | null;
		paginationQuery: Record<string, string | number | undefined>;
		onSuccess?: () => void | Promise<void>;
	}

	let { open = $bindable(false), categoryId, paginationQuery, onSuccess = () => {} }: Props =
		$props();

	let listData = $state<{ rows: Product[]; pagination: PaginationMeta } | null>(null);
	let sheetPage = $state(1);
	let sheetLimit = $state(20);
	let search = $state('');
	let selectedIds = $state<Set<string>>(new Set());
	let submitting = $state(false);
	let error = $state<string | null>(null);

	const list = $derived(listData?.rows ?? []);
	const pagination = $derived(listData?.pagination ?? null);
	const filtered = $derived(
		search.trim()
			? list.filter((p) =>
					p.title.toLowerCase().includes(search.trim().toLowerCase())
				)
			: list
	);
	const count = $derived(pagination?.total ?? 0);
	const totalPages = $derived(pagination?.total_pages ?? 1);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, count) : 0
	);

	async function loadList() {
		try {
			const sortDir = paginationQuery.sorting_direction ?? 'desc';
			const res = await client.products.get({
				query: {
					...paginationQuery,
					page: sheetPage,
					limit: sheetLimit,
					sorting_field: (paginationQuery.sorting_field as string) ?? 'created_at',
					sorting_direction: sortDir === 'asc' ? 'asc' : 'desc'
				} as Record<string, string | number | undefined>
			});
			const data = res.data as { data?: { rows: Product[]; pagination: PaginationMeta } };
			listData = data?.data ?? null;
		} catch {
			listData = null;
		}
	}

	$effect(() => {
		if (open) {
			selectedIds = new Set();
			sheetPage = 1;
			search = '';
			error = null;
			sheetPage;
			sheetLimit;
			paginationQuery;
			loadList();
		}
	});

	function closeSheet() {
		open = false;
		error = null;
	}

	function toggleSelection(id: string) {
		selectedIds = new Set(selectedIds);
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
		selectedIds = new Set(selectedIds);
	}

	function toggleSelectAll() {
		if (selectedIds.size === filtered.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filtered.map((p) => p.id));
		}
	}

	async function submit() {
		if (!categoryId) return;
		const ids = Array.from(selectedIds);
		if (ids.length === 0) {
			error = 'Select at least one product';
			return;
		}
		error = null;
		submitting = true;
		try {
			for (const productId of ids) {
				await client.products({ id: productId }).put({
					category_id: categoryId
				} as Record<string, string>);
			}
			closeSheet();
			await onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-4xl sm:max-w-4xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Add products</h2>
				<p class="mt-1 text-sm text-muted-foreground">Select products to add to this category.</p>
			</div>
			<Button onclick={() => (open = false)}>Add product to this category</Button>
			<ProductListingCard
				filter={{ exclude_category_ids: [categoryId] }}
				bind:selectedIds={selectedIds}
			/>
	</Sheet.Content>
</Sheet.Root> -->
