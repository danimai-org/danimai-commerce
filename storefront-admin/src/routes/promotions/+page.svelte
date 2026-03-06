<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CreatePromotionSheet,
		DeleteConfirmationModal,
		EditPromotionSheet,
		PromotionDetailsSheet,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn,
		type Promotion,
		type Campaign
	} from '$lib/components/organs/index.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Folder from '@lucide/svelte/icons/folder';

	// Load from localStorage or use default
	function loadPromotions(): Promotion[] {
		if (typeof window === 'undefined') {
			return [{ id: '1', code: 'SUMMER15', method: 'Automatic', status: 'Active' }];
		}
		try {
			const stored = localStorage.getItem('promotions');
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (e) {
			console.error('Failed to load promotions from localStorage:', e);
		}
		return [{ id: '1', code: 'SUMMER15', method: 'Automatic', status: 'Active' }];
	}

	function savePromotionsToStorage(proms: Promotion[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('promotions', JSON.stringify(proms));
			} catch (e) {
				console.error('Failed to save promotions to localStorage:', e);
			}
		}
	}

	// In-memory state with localStorage persistence
	let promotions = $state<Promotion[]>(loadPromotions());
	let campaigns = $state<Campaign[]>(loadCampaigns());
	let searchQuery = $state('');

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			const allPromotions = loadPromotions();
			const campaignsList = loadCampaigns();
			const q = searchQuery.trim().toLowerCase();
			const filteredList = q
				? allPromotions.filter((p) => {
						const codeMatch = p.code?.toLowerCase().includes(q) ?? false;
						const methodMatch = p.method.toLowerCase().includes(q);
						const campaign = p.campaign_id
							? campaignsList.find((c) => c.id === p.campaign_id)
							: null;
						const campaignMatch = campaign
							? campaign.name.toLowerCase().includes(q)
							: false;
						return codeMatch || methodMatch || campaignMatch;
					})
				: allPromotions;
			const pageNum = Number((paginationQuery as Record<string, string>)?.['page']) || 1;
			const limitNum = Number((paginationQuery as Record<string, string>)?.['limit']) || 10;
			const total = filteredList.length;
			const totalPages = Math.max(1, Math.ceil(total / limitNum));
			const startIdx = (pageNum - 1) * limitNum;
			const slice = filteredList.slice(startIdx, startIdx + limitNum);
			const rows = slice.map((p) => {
				const campaign = p.campaign_id
					? campaignsList.find((c) => c.id === p.campaign_id)
					: null;
				return { ...p, campaign_name: campaign?.name ?? '—' };
			});
			return {
				rows,
				pagination: {
					total,
					page: pageNum,
					limit: limitNum,
					total_pages: totalPages,
					has_next_page: pageNum < totalPages,
					has_previous_page: pageNum > 1
				}
			};
		},
		['promotions']
	);

	$effect(() => {
		searchQuery;
		page.url.searchParams.toString();
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const rows = $derived((paginateState.query.data?.rows ?? []) as Record<string, unknown>[]);
	const listPagination = $derived(paginateState.query.data?.pagination ?? null);
	const start = $derived(
		listPagination ? (listPagination.page - 1) * listPagination.limit + 1 : 0
	);
	const end = $derived(
		listPagination ? Math.min(listPagination.page * listPagination.limit, listPagination.total) : 0
	);

	// Create promotion flow
	let createOpen = $state(false);
	let detailsOpen = $state(false);
	let viewingPromotion = $state<Promotion | null>(null);
	let editOpen = $state(false);
	let editingPromotion = $state<Promotion | null>(null);
	let deleteModalOpen = $state(false);
	let promotionToDelete = $state<Promotion | null>(null);

	function loadCampaigns(): Campaign[] {
		if (typeof window === 'undefined') {
			return [
				{
					id: '1',
					name: 'Big Bang sale',
					description: null,
					identifier: 'BIGBANG',
					start_date: null,
					end_date: null
				}
			];
		}
		try {
			const stored = localStorage.getItem('campaigns');
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (e) {
			console.error('Failed to load campaigns from localStorage:', e);
		}
		return [
			{
				id: '1',
				name: 'Big Bang sale',
				description: null,
				identifier: 'BIGBANG',
				start_date: null,
				end_date: null
			}
		];
	}

	function saveCampaignsToStorage(camps: Campaign[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('campaigns', JSON.stringify(camps));
			} catch (e) {
				console.error('Failed to save campaigns to localStorage:', e);
			}
		}
	}

	function openCreate() {
		createOpen = true;
	}

	function handleCreateSave(payload: { promotion: Promotion; newCampaign?: Campaign }) {
		promotions = [...promotions, payload.promotion];
		savePromotionsToStorage(promotions);
		if (payload.newCampaign) {
			campaigns = [...campaigns, payload.newCampaign];
			saveCampaignsToStorage(campaigns);
		}
		paginateState.refetch();
	}

	function openDetails(p: Promotion) {
		viewingPromotion = p;
		detailsOpen = true;
	}

	function closeDetails() {
		detailsOpen = false;
		viewingPromotion = null;
	}

	function openEdit(p: Promotion) {
		editingPromotion = p;
		editOpen = true;
	}

	function handleEditSave(updated: Pick<Promotion, 'id' | 'code' | 'method' | 'status'>) {
		promotions = promotions.map((x) =>
			x.id === updated.id ? { ...x, code: updated.code, method: updated.method, status: updated.status } : x
		);
		savePromotionsToStorage(promotions);
		editingPromotion = null;
		paginateState.refetch();
	}

	$effect(() => {
		if (!editOpen) editingPromotion = null;
		campaigns = loadCampaigns();
	});

	function deletePromotion(p: Promotion) {
		promotions = promotions.filter((x) => x.id !== p.id);
		savePromotionsToStorage(promotions);
	}

	function openDeleteModal(p: Promotion) {
		promotionToDelete = p;
		deleteModalOpen = true;
	}

	function handleConfirmDelete() {
		if (promotionToDelete) {
			deletePromotion(promotionToDelete);
			promotionToDelete = null;
			deleteModalOpen = false;
			paginateState.refetch();
		}
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Code', key: 'code', type: 'text' },
		{ label: 'Method', key: 'method', type: 'text' },
		{ label: 'Campaign', key: 'campaign_name', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{ label: 'View', key: 'view', type: 'button', onClick: (item) => openDetails(item as Promotion) },
				{ label: 'Edit', key: 'edit', type: 'button', onClick: (item) => openEdit(item as Promotion) },
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteModal(item as Promotion)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Promotions | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Folder class="size-4" />
				<span class="font-semibold">Promotions</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>
		<PaginationTable searchPlaceholder="Search" bind:searchQuery>
			{#if paginateState.error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{paginateState.error}
				</div>
			{:else if paginateState.loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rows}
							columns={tableColumns}
							emptyMessage="No promotions found."
						/>
					</table>
				</div>

				<TablePagination
					pagination={listPagination}
					{start}
					{end}
					onPageChange={goToPage}
				/>
			{/if}
		</PaginationTable>
	</div>
</div>


<!-- Create Promotion Sheet -->
<CreatePromotionSheet bind:open={createOpen} campaigns={campaigns} onSave={handleCreateSave} />

<!-- Details Promotion Sheet -->
<PromotionDetailsSheet bind:open={detailsOpen} promotion={viewingPromotion} campaigns={campaigns} onEdit={openEdit} />

<!-- Edit Promotion Sheet -->
<EditPromotionSheet bind:open={editOpen} promotion={editingPromotion} onSave={handleEditSave} />


<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="promotion"
	entityTitle={promotionToDelete?.code ?? ''}
	onConfirm={handleConfirmDelete}
	onCancel={() => (promotionToDelete = null)}
/>
