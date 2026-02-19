<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Folder from '@lucide/svelte/icons/folder';
	import Clock from '@lucide/svelte/icons/clock';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Plus from '@lucide/svelte/icons/plus';
	import Info from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';

	type Campaign = {
		id: string;
		name: string;
		description: string | null;
		identifier: string;
		start_date: string | null;
		end_date: string | null;
		budget_type?: 'usage' | 'spend' | null;
		budget_limit?: number | null;
		budget_limit_per?: number | null;
	};

	type Promotion = {
		id: string;
		code: string;
		method: 'Automatic' | 'Manual';
		status: 'Active' | 'Inactive' | 'Draft';
		campaign_id?: string | null;
	};

	type PromotionTypeId =
		| 'amount_off_products'
		| 'amount_off_order'
		| 'percentage_off_product'
		| 'percentage_off_order'
		| 'buy_x_get_y'
		| 'free_shipping';

	const PROMOTION_TYPES: { id: PromotionTypeId; label: string; description: string }[] = [
		{
			id: 'amount_off_products',
			label: 'Amount off products',
			description: 'Discount specific products or collection of products.'
		},
		{
			id: 'amount_off_order',
			label: 'Amount off order',
			description: 'Discounts the total order amount.'
		},
		{
			id: 'percentage_off_product',
			label: 'Percentage off product',
			description: 'Discounts a percentage off selected products.'
		},
		{
			id: 'percentage_off_order',
			label: 'Percentage off order',
			description: 'Discounts a percentage of the total order amount.'
		},
		{
			id: 'buy_x_get_y',
			label: 'Buy X Get Y',
			description: 'Buy X product(s), get Y product(s).'
		},
		{
			id: 'free_shipping',
			label: 'Free shipping',
			description: 'Applies a 100% discount to shipping fees.'
		}
	];

	const CURRENCIES = [
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'INR', name: 'Indian Rupee', symbol: '₹' },
		{ code: 'EUR', name: 'Euro', symbol: '€' },
		{ code: 'GBP', name: 'British Pound', symbol: '£' }
	] as const;

	// Load from localStorage or use default
	function loadCampaigns(): Campaign[] {
		if (typeof window === 'undefined') {
		return [
			{
				id: '1',
				name: 'Big Bang sale',
				description: null,
				identifier: 'BIGBANG',
				start_date: null,
				end_date: null,
				budget_type: null,
				budget_limit: null,
				budget_limit_per: null
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
				end_date: null,
				budget_type: null,
				budget_limit: null,
				budget_limit_per: null
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

	function loadPromotions(): Promotion[] {
		if (typeof window === 'undefined') {
			return [];
		}
		try {
			const stored = localStorage.getItem('promotions');
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (e) {
			console.error('Failed to load promotions from localStorage:', e);
		}
		return [];
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

	let campaigns = $state<Campaign[]>(loadCampaigns());
	let searchQuery = $state('');
	let page = $state(1);
	const limit = 10;

	const filtered = $derived(
		searchQuery.trim()
			? campaigns.filter(
					(c) =>
						c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						c.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
				)
			: campaigns
	);
	const total = $derived(filtered.length);
	const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	const start = $derived(total > 0 ? (page - 1) * limit + 1 : 0);
	const end = $derived(Math.min(page * limit, total));
	const pageData = $derived(filtered.slice((page - 1) * limit, page * limit));

	// Create campaign sheet
	let createOpen = $state(false);
	let createName = $state('');
	let createIdentifier = $state('');
	let createDescription = $state('');
	let createStartDate = $state('');
	let createEndDate = $state('');
	let createBudgetType = $state<'usage' | 'spend'>('usage');
	let createBudgetLimit = $state('');
	let createBudgetLimitPer = $state<number>(10);
	let createError = $state<string | null>(null);

	// Edit campaign sheet
	let editOpen = $state(false);
	let editingCampaign = $state<Campaign | null>(null);
	let editName = $state('');
	let editIdentifier = $state('');
	let editDescription = $state('');
	let editStartDate = $state('');
	let editEndDate = $state('');
	let editError = $state<string | null>(null);

	// Delete confirmation
	let deleteModalOpen = $state(false);
	let campaignToDelete = $state<Campaign | null>(null);

	// View campaign sheet
	let viewOpen = $state(false);
	let viewingCampaign = $state<Campaign | null>(null);
	let promotions = $state<Promotion[]>(loadPromotions());
	let editingInfo = $state(false);
	let editingConfig = $state(false);
	let viewName = $state('');
	let viewIdentifier = $state('');
	let viewDescription = $state('');
	let viewStartDate = $state('');
	let viewEndDate = $state('');
	let viewError = $state<string | null>(null);

	// Create promotion flow
	let createPromotionOpen = $state(false);
	let createPromotionStep = $state(1);
	let createPromotionType = $state<PromotionTypeId>('amount_off_products');
	let createPromotionCampaignId = $state<string | null>(null);
	let detailMethod = $state<'promotion_code' | 'automatic'>('promotion_code');
	let detailStatus = $state<'draft' | 'active'>('draft');
	let detailCode = $state('');
	let detailIncludeTaxes = $state(false);
	let detailPromotionValue = $state('');
	let detailMaxQuantity = $state<number | ''>(1);
	let detailValueCurrency = $state('USD');
	type CodeCondition = { id: string; field: string; op: string; value: string };
	let detailCodeConditions = $state<CodeCondition[]>([]);
	let detailItemConditions = $state<CodeCondition[]>([]);
	let detailCartConditions = $state<CodeCondition[]>([]);
	let detailShippingConditions = $state<CodeCondition[]>([]);

	const typeLabel = $derived(PROMOTION_TYPES.find((t) => t.id === createPromotionType)?.label ?? createPromotionType);
	const isPercentageType = $derived(
		createPromotionType === 'percentage_off_product' || createPromotionType === 'percentage_off_order'
	);
	const isBuyXGetY = $derived(createPromotionType === 'buy_x_get_y');
	const isFreeShipping = $derived(createPromotionType === 'free_shipping');

	function openCreate() {
		createOpen = true;
		createName = '';
		createIdentifier = '';
		createDescription = '';
		createStartDate = '';
		createEndDate = '';
		createBudgetType = 'usage';
		createBudgetLimit = '';
		createBudgetLimitPer = 10;
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	function submitCreate() {
		createError = null;
		if (!createName.trim()) {
			createError = 'Name is required';
			return;
		}
		if (!createIdentifier.trim()) {
			createError = 'Identifier is required';
			return;
		}
		const newCampaign: Campaign = {
			id: crypto.randomUUID(),
			name: createName.trim(),
			description: createDescription.trim() || null,
			identifier: createIdentifier.trim(),
			start_date: createStartDate || null,
			end_date: createEndDate || null,
			budget_type: createBudgetType,
			budget_limit: createBudgetLimit ? parseFloat(createBudgetLimit) : null,
			budget_limit_per: createBudgetLimitPer || null
		};
		campaigns = [...campaigns, newCampaign];
		saveCampaignsToStorage(campaigns);
		closeCreate();
	}

	function openEdit(c: Campaign) {
		editingCampaign = c;
		editName = c.name;
		editIdentifier = c.identifier;
		editDescription = c.description || '';
		editStartDate = c.start_date ? new Date(c.start_date).toISOString().slice(0, 16) : '';
		editEndDate = c.end_date ? new Date(c.end_date).toISOString().slice(0, 16) : '';
		editError = null;
		editOpen = true;
	}

	function closeEdit() {
		editOpen = false;
		editingCampaign = null;
	}

	function saveEdit() {
		if (!editingCampaign) return;
		editError = null;
		if (!editName.trim()) {
			editError = 'Name is required';
			return;
		}
		if (!editIdentifier.trim()) {
			editError = 'Identifier is required';
			return;
		}
		campaigns = campaigns.map((x) =>
			x.id === editingCampaign!.id
				? {
						...x,
						name: editName.trim(),
						identifier: editIdentifier.trim(),
						description: editDescription.trim() || null,
						start_date: editStartDate || null,
						end_date: editEndDate || null
					}
				: x
		);
		saveCampaignsToStorage(campaigns);
		closeEdit();
	}

	function deleteCampaign(c: Campaign) {
		campaigns = campaigns.filter((x) => x.id !== c.id);
		saveCampaignsToStorage(campaigns);
	}

	function openDeleteModal(c: Campaign) {
		campaignToDelete = c;
		deleteModalOpen = true;
	}

	function handleConfirmDelete() {
		if (campaignToDelete) {
			deleteCampaign(campaignToDelete);
			campaignToDelete = null;
			deleteModalOpen = false;
		}
	}

	function openView(c: Campaign) {
		viewingCampaign = c;
		promotions = loadPromotions();
		viewName = c.name;
		viewIdentifier = c.identifier;
		viewDescription = c.description || '';
		viewStartDate = c.start_date ? new Date(c.start_date).toISOString().slice(0, 16) : '';
		viewEndDate = c.end_date ? new Date(c.end_date).toISOString().slice(0, 16) : '';
		editingInfo = false;
		editingConfig = false;
		viewError = null;
		viewOpen = true;
	}

	function closeView() {
		viewOpen = false;
		viewingCampaign = null;
		editingInfo = false;
		editingConfig = false;
	}

	function startEditInfo() {
		if (viewingCampaign) {
			viewName = viewingCampaign.name;
			viewIdentifier = viewingCampaign.identifier;
			viewDescription = viewingCampaign.description || '';
			viewError = null;
			editingInfo = true;
		}
	}

	function cancelEditInfo() {
		if (viewingCampaign) {
			viewName = viewingCampaign.name;
			viewIdentifier = viewingCampaign.identifier;
			viewDescription = viewingCampaign.description || '';
			viewError = null;
			editingInfo = false;
		}
	}

	function saveInfo() {
		if (!viewingCampaign) return;
		viewError = null;
		if (!viewName.trim()) {
			viewError = 'Name is required';
			return;
		}
		if (!viewIdentifier.trim()) {
			viewError = 'Identifier is required';
			return;
		}
		campaigns = campaigns.map((x) =>
			x.id === viewingCampaign!.id
				? {
						...x,
						name: viewName.trim(),
						identifier: viewIdentifier.trim(),
						description: viewDescription.trim() || null
					}
				: x
		);
		saveCampaignsToStorage(campaigns);
		viewingCampaign = campaigns.find((c) => c.id === viewingCampaign!.id) || null;
		editingInfo = false;
	}

	function startEditConfig() {
		if (viewingCampaign) {
			viewStartDate = viewingCampaign.start_date ? new Date(viewingCampaign.start_date).toISOString().slice(0, 16) : '';
			viewEndDate = viewingCampaign.end_date ? new Date(viewingCampaign.end_date).toISOString().slice(0, 16) : '';
			viewError = null;
			editingConfig = true;
		}
	}

	function cancelEditConfig() {
		if (viewingCampaign) {
			viewStartDate = viewingCampaign.start_date ? new Date(viewingCampaign.start_date).toISOString().slice(0, 16) : '';
			viewEndDate = viewingCampaign.end_date ? new Date(viewingCampaign.end_date).toISOString().slice(0, 16) : '';
			viewError = null;
			editingConfig = false;
		}
	}

	function saveConfig() {
		if (!viewingCampaign) return;
		viewError = null;
		campaigns = campaigns.map((x) =>
			x.id === viewingCampaign!.id
				? {
						...x,
						start_date: viewStartDate || null,
						end_date: viewEndDate || null
					}
				: x
		);
		saveCampaignsToStorage(campaigns);
		viewingCampaign = campaigns.find((c) => c.id === viewingCampaign!.id) || null;
		editingConfig = false;
	}

	function openCreatePromotion(campaignId: string) {
		createPromotionOpen = true;
		createPromotionStep = 1;
		createPromotionType = 'amount_off_products';
		createPromotionCampaignId = campaignId;
		detailMethod = 'promotion_code';
		detailStatus = 'draft';
		detailCode = '';
		detailIncludeTaxes = false;
		detailPromotionValue = '';
		detailValueCurrency = 'USD';
		detailMaxQuantity = 1;
		detailCodeConditions = [];
		detailItemConditions = [];
		detailCartConditions = [];
		detailShippingConditions = [];
	}

	function closeCreatePromotion() {
		createPromotionOpen = false;
		createPromotionCampaignId = null;
	}

	function goToPromotionDetails() {
		createPromotionStep = 2;
	}

	function goToPromotionCampaign() {
		createPromotionStep = 3;
	}

	function savePromotion() {
		// Validate required fields
		if (detailMethod === 'promotion_code' && !detailCode.trim()) {
			return;
		}

		// Create new promotion
		const newPromotion: Promotion = {
			id: crypto.randomUUID(),
			code: detailMethod === 'promotion_code' ? detailCode.trim() : '',
			method: detailMethod === 'automatic' ? 'Automatic' : 'Manual',
			status:
				detailStatus === 'active'
					? 'Active'
					: detailStatus === 'draft'
						? 'Draft'
						: 'Inactive',
			campaign_id: createPromotionCampaignId
		};

		// Add promotion to promotions array
		promotions = [...promotions, newPromotion];
		savePromotionsToStorage(promotions);

		// Reload promotions to update the view
		if (viewOpen && viewingCampaign) {
			promotions = loadPromotions();
		}

		// Close the create sheet
		closeCreatePromotion();
	}

	function addCodeCondition() {
		detailCodeConditions = [
			...detailCodeConditions,
			{ id: crypto.randomUUID(), field: 'currency_code', op: 'equals', value: '' }
		];
	}

	function clearCodeConditions() {
		detailCodeConditions = [];
	}

	function removeCodeCondition(id: string) {
		detailCodeConditions = detailCodeConditions.filter((c) => c.id !== id);
	}

	function addCartCondition() {
		detailCartConditions = [
			...detailCartConditions,
			{ id: crypto.randomUUID(), field: 'minimum_quantity_of_items', op: 'equals', value: '' }
		];
	}
	function clearCartConditions() {
		detailCartConditions = [];
	}
	function removeCartCondition(id: string) {
		detailCartConditions = detailCartConditions.filter((c) => c.id !== id);
	}

	function addItemCondition() {
		detailItemConditions = [
			...detailItemConditions,
			{ id: crypto.randomUUID(), field: 'quantity_promotion_applies_to', op: 'equals', value: '' }
		];
	}
	function clearItemConditions() {
		detailItemConditions = [];
	}
	function removeItemCondition(id: string) {
		detailItemConditions = detailItemConditions.filter((c) => c.id !== id);
	}

	function addShippingCondition() {
		detailShippingConditions = [
			...detailShippingConditions,
			{ id: crypto.randomUUID(), field: 'shipping_method', op: 'equals', value: '' }
		];
	}
	function clearShippingConditions() {
		detailShippingConditions = [];
	}
	function removeShippingCondition(id: string) {
		detailShippingConditions = detailShippingConditions.filter((c) => c.id !== id);
	}

	const campaignPromotions = $derived(
		viewingCampaign
			? promotions.filter((p) => p.campaign_id === viewingCampaign!.id)
			: []
	);

	$effect(() => {
		if (!editOpen) editingCampaign = null;
		if (viewOpen && viewingCampaign) {
			promotions = loadPromotions();
			// Sync view state with campaign data
			if (!editingInfo && !editingConfig) {
				viewName = viewingCampaign.name;
				viewIdentifier = viewingCampaign.identifier;
				viewDescription = viewingCampaign.description || '';
				viewStartDate = viewingCampaign.start_date ? new Date(viewingCampaign.start_date).toISOString().slice(0, 16) : '';
				viewEndDate = viewingCampaign.end_date ? new Date(viewingCampaign.end_date).toISOString().slice(0, 16) : '';
			}
		}
		if (!viewOpen) {
			editingInfo = false;
			editingConfig = false;
		}
	});

	function formatDate(value: string | null) {
		if (!value) return '';
		return new Date(value).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateTime(value: string | null) {
		if (!value) return '';
		return new Date(value).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getCampaignStatus(campaign: Campaign): 'scheduled' | 'active' | 'expired' {
		const now = new Date();
		if (campaign.start_date) {
			const start = new Date(campaign.start_date);
			if (start > now) return 'scheduled';
		}
		if (campaign.end_date) {
			const end = new Date(campaign.end_date);
			if (end < now) return 'expired';
		}
		if (campaign.start_date && campaign.end_date) {
			const start = new Date(campaign.start_date);
			const end = new Date(campaign.end_date);
			if (start <= now && end >= now) return 'active';
		}
		if (campaign.start_date) {
			const start = new Date(campaign.start_date);
			if (start <= now) return 'active';
		}
		return 'active';
	}

	function statusBadgeClass(status: 'scheduled' | 'active' | 'expired'): string {
		const base = 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium';
		switch (status) {
			case 'active':
				return `${base} bg-green-500/10 text-green-700 dark:text-green-400`;
			case 'scheduled':
				return `${base} bg-amber-500/10 text-amber-700 dark:text-amber-400`;
			case 'expired':
				return `${base} bg-muted text-muted-foreground`;
			default:
				return `${base} bg-muted text-muted-foreground`;
		}
	}

	function statusBadgeDot(status: 'scheduled' | 'active' | 'expired'): string {
		switch (status) {
			case 'active':
				return 'size-1.5 rounded-full bg-green-600';
			case 'scheduled':
				return 'size-1.5 rounded-full bg-amber-600';
			case 'expired':
				return 'size-1.5 rounded-full bg-muted-foreground/60';
			default:
				return 'size-1.5 rounded-full bg-muted-foreground/60';
		}
	}
</script>

<svelte:head>
	<title>Campaigns | Promotions | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex flex-col gap-4">
			<div class="flex items-center justify-between gap-4 border-b pb-4">
				<h1 class="relative flex items-center gap-2 text-xl font-semibold">
					<Folder class="relative size-5 shrink-0" />
					Campaigns
				</h1>
				<Button size="sm" onclick={openCreate}>Create</Button>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-2">
				<div class="relative w-64">
					<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search"
						bind:value={searchQuery}
						class="h-9 rounded-md pl-9"
					/>
				</div>
				<Button variant="outline" size="icon" class="size-9">
					<SlidersHorizontal class="size-4" />
					<span class="sr-only">Filters</span>
				</Button>
			</div>
		</div>

		<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
			<table class="w-full text-sm">
				<thead class="sticky top-0 border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Name</th>
						<th class="px-4 py-3 text-left font-medium">Description</th>
						<th class="px-4 py-3 text-left font-medium">Identifier</th>
						<th class="px-4 py-3 text-left font-medium">Start date</th>
						<th class="px-4 py-3 text-left font-medium">End date</th>
						<th class="w-10 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#if pageData.length === 0}
						<tr>
							<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
								No campaigns found.
							</td>
						</tr>
					{:else}
						{#each pageData as campaign (campaign.id)}
							<tr class="border-b transition-colors hover:bg-muted/30">
								<td class="px-4 py-3">
									<button
										onclick={() => openView(campaign)}
										class="font-medium text-left hover:underline cursor-pointer"
									>
										{campaign.name}
									</button>
								</td>
								<td class="px-4 py-3 text-muted-foreground">
									{campaign.description ?? '-'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">{campaign.identifier}</td>
								<td class="px-4 py-3 text-muted-foreground">
									{formatDate(campaign.start_date) || '-'}
								</td>
								<td class="px-4 py-3 text-muted-foreground">
									{formatDate(campaign.end_date) || '-'}
								</td>
								<td class="px-4 py-3">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
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
													textValue="Edit"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openEdit(campaign)}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openDeleteModal(campaign)}
												>
													<Trash2 class="size-4" />
													Delete
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

		<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
			<p class="text-sm text-muted-foreground">
				{#if total > 0}
					{start} – {end} of {total} results
				{:else}
					0 results
				{/if}
			</p>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" disabled={page <= 1} onclick={() => (page = page - 1)}>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">
					{page} of {totalPages} pages
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={page >= totalPages}
					onclick={() => (page = page + 1)}
				>
					Next
				</Button>
			</div>
		</div>
	</div>
</div>

<!-- Create Campaign Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Create Campaign</h2>
				<p class="text-sm text-muted-foreground">Create a promotional campaign.</p>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if createError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}

				<!-- Campaign details -->
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-2">
								<label for="create-campaign-name" class="text-sm font-medium">Name</label>
								<Input
									id="create-campaign-name"
									bind:value={createName}
									placeholder="e.g. Summer Sale"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-campaign-identifier" class="text-sm font-medium">Identifier</label>
								<Input
									id="create-campaign-identifier"
									bind:value={createIdentifier}
									placeholder="e.g. SUMMER24"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-campaign-description" class="text-sm font-medium">
									Description <span class="font-normal text-muted-foreground">(Optional)</span>
								</label>
								<textarea
									id="create-campaign-description"
									bind:value={createDescription}
									rows="3"
									class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
									placeholder="Campaign description"
								></textarea>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex min-w-0 flex-col gap-2">
									<label for="create-campaign-start" class="text-sm font-medium">
										Start date <span class="font-normal text-muted-foreground">(Optional)</span>
									</label>
									<div class="relative">
										<Clock
											class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="create-campaign-start"
											type="datetime-local"
											bind:value={createStartDate}
											class="h-9 w-full pl-[18px]"
										/>
									</div>
								</div>
								<div class="flex min-w-0 flex-col gap-2">
									<label for="create-campaign-end" class="text-sm font-medium">
										End date <span class="font-normal text-muted-foreground">(Optional)</span>
									</label>
									<div class="relative">
										<Clock
											class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="create-campaign-end"
											type="datetime-local"
											bind:value={createEndDate}
											class="h-9 w-full pl-[18px]"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Campaign Budget -->
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-1">
							<h3 class="text-sm font-semibold">Campaign Budget</h3>
							<p class="text-xs text-muted-foreground">Create a budget for the campaign.</p>
						</div>
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-2">
								<div class="text-sm font-medium">Type</div>
								<div class="flex flex-col gap-2">
									<label
										class={cn(
											'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
											createBudgetType === 'usage'
												? 'border-primary bg-primary/5'
												: 'border-input hover:bg-muted/30'
										)}
									>
										<input
											type="radio"
											name="create-budget-type"
											value="usage"
											checked={createBudgetType === 'usage'}
											onchange={() => (createBudgetType = 'usage')}
											class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
										/>
										<div>
											<span class="font-medium">Usage</span>
											<p class="mt-0.5 text-sm text-muted-foreground">
												Set a limit on how many times the promotion can be used.
											</p>
										</div>
									</label>
									<label
										class={cn(
											'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
											createBudgetType === 'spend'
												? 'border-primary bg-primary/5'
												: 'border-input hover:bg-muted/30'
										)}
									>
										<input
											type="radio"
											name="create-budget-type"
											value="spend"
											checked={createBudgetType === 'spend'}
											onchange={() => (createBudgetType = 'spend')}
											class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
										/>
										<div>
											<span class="font-medium">Spend</span>
											<p class="mt-0.5 text-sm text-muted-foreground">
												Set a limit on the total discounted amount of all promotion usages.
											</p>
										</div>
									</label>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="create-budget-limit" class="text-sm font-medium">Limit</label>
								<Input
									id="create-budget-limit"
									type="number"
									bind:value={createBudgetLimit}
									placeholder="Enter limit"
									class="h-9"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<label for="create-budget-limit-per" class="text-sm font-medium">Limit usage per</label>
									<Info class="size-4 text-muted-foreground" />
								</div>
								<Input
									id="create-budget-limit-per"
									type="number"
									bind:value={createBudgetLimitPer}
									min="1"
									placeholder="10"
									class="h-9"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				<Button onclick={submitCreate}>Create</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Campaign Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Edit Campaign</h2>
				<p class="text-sm text-muted-foreground">Edit campaign details.</p>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if editError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}

				<!-- Campaign details -->
				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-campaign-name" class="text-sm font-medium">Name</label>
							<Input
								id="edit-campaign-name"
								bind:value={editName}
								placeholder="e.g. Summer Sale"
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-campaign-identifier" class="text-sm font-medium">Identifier</label>
							<Input
								id="edit-campaign-identifier"
								bind:value={editIdentifier}
								placeholder="e.g. SUMMER24"
								class="h-9"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-campaign-description" class="text-sm font-medium">
							Description <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<textarea
							id="edit-campaign-description"
							bind:value={editDescription}
							rows="3"
							class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Campaign description"
						></textarea>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex min-w-0 flex-col gap-2">
							<label for="edit-campaign-start" class="text-sm font-medium">
								Start date <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<div class="relative">
								<Clock
									class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="edit-campaign-start"
									type="datetime-local"
									bind:value={editStartDate}
									class="h-9 w-full pl-[18px]"
								/>
							</div>
						</div>
						<div class="flex min-w-0 flex-col gap-2">
							<label for="edit-campaign-end" class="text-sm font-medium">
								End date <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<div class="relative">
								<Clock
									class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="edit-campaign-end"
									type="datetime-local"
									bind:value={editEndDate}
									class="h-9 w-full pl-[18px]"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={saveEdit}>Save</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- View Campaign Sheet -->
<Sheet.Root bind:open={viewOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-3 border-b px-6 py-4">
				<div class="flex items-start justify-between gap-4 pt-5">
					<div class="flex-1">
						<div class="text-base font-bold text-muted-foreground mb-1">Campaign Information</div>
					</div>
					{#if viewingCampaign}
						<span class={statusBadgeClass(getCampaignStatus(viewingCampaign))}>
							<span class={statusBadgeDot(getCampaignStatus(viewingCampaign))}></span>
							{getCampaignStatus(viewingCampaign).charAt(0).toUpperCase() +
								getCampaignStatus(viewingCampaign).slice(1)}
						</span>
					{/if}
				</div>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if viewingCampaign}
					<div class="flex flex-col gap-6">
						{#if viewError}
							<div
								class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
							>
								{viewError}
							</div>
						{/if}

						<!-- Campaign Information Card -->
						<div class="rounded-lg border bg-card p-6">
							<div class="flex items-start justify-between mb-4">
								<h3 class="text-sm font-semibold">Campaign Information</h3>
								{#if !editingInfo}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
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
													textValue="Edit"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={startEditInfo}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								{/if}
							</div>
							{#if editingInfo}
								<div class="flex flex-col gap-4">
									<div class="flex flex-col gap-2">
										<label for="view-campaign-name" class="text-xs font-medium text-muted-foreground">Name</label>
										<Input
											id="view-campaign-name"
											bind:value={viewName}
											placeholder="e.g. Summer Sale"
											class="h-9"
										/>
									</div>
									<div class="flex flex-col gap-2">
										<label for="view-campaign-identifier" class="text-xs font-medium text-muted-foreground">Identifier</label>
										<Input
											id="view-campaign-identifier"
											bind:value={viewIdentifier}
											placeholder="e.g. SUMMER24"
											class="h-9 font-mono"
										/>
									</div>
									<div class="flex flex-col gap-2">
										<label for="view-campaign-description" class="text-xs font-medium text-muted-foreground">
											Description <span class="font-normal text-muted-foreground">(Optional)</span>
										</label>
										<textarea
											id="view-campaign-description"
											bind:value={viewDescription}
											rows="3"
											class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
											placeholder="Campaign description"
										></textarea>
									</div>
									<div class="flex justify-end gap-2 pt-2">
										<Button variant="outline" size="sm" onclick={cancelEditInfo}>Cancel</Button>
										<Button size="sm" onclick={saveInfo}>Save</Button>
									</div>
								</div>
							{:else}
								<div class="flex flex-col gap-4">
									<div class="flex flex-col gap-2">
										<div class="text-xs font-medium text-muted-foreground">Name</div>
										<p class="text-sm font-medium">{viewingCampaign.name}</p>
									</div>
									<div class="flex flex-col gap-2">
										<div class="text-xs font-medium text-muted-foreground">Identifier</div>
										<p class="text-sm font-mono">{viewingCampaign.identifier}</p>
									</div>
									{#if viewingCampaign.description}
										<div class="flex flex-col gap-2">
											<div class="text-xs font-medium text-muted-foreground">Description</div>
											<p class="text-sm text-muted-foreground">{viewingCampaign.description}</p>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Configuration Card -->
						<div class="rounded-lg border bg-card p-6">
							<div class="flex items-start justify-between mb-4">
								<h3 class="text-sm font-semibold">Configuration</h3>
								{#if !editingConfig}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
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
													textValue="Edit"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={startEditConfig}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								{/if}
							</div>
							{#if editingConfig}
								<div class="flex flex-col gap-4">
									<div class="grid grid-cols-2 gap-4">
										<div class="flex min-w-0 flex-col gap-2">
											<label for="view-campaign-start" class="text-xs font-medium text-muted-foreground">
												Start date <span class="font-normal text-muted-foreground">(Optional)</span>
											</label>
											<div class="relative">
												<Clock
													class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
												/>
												<Input
													id="view-campaign-start"
													type="datetime-local"
													bind:value={viewStartDate}
													class="h-9 w-full pl-[18px]"
												/>
											</div>
										</div>
										<div class="flex min-w-0 flex-col gap-2">
											<label for="view-campaign-end" class="text-xs font-medium text-muted-foreground">
												End date <span class="font-normal text-muted-foreground">(Optional)</span>
											</label>
											<div class="relative">
												<Clock
													class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground"
												/>
												<Input
													id="view-campaign-end"
													type="datetime-local"
													bind:value={viewEndDate}
													class="h-9 w-full pl-[18px]"
												/>
											</div>
										</div>
									</div>
									<div class="flex justify-end gap-2 pt-2">
										<Button variant="outline" size="sm" onclick={cancelEditConfig}>Cancel</Button>
										<Button size="sm" onclick={saveConfig}>Save</Button>
									</div>
								</div>
							{:else}
								<div class="grid grid-cols-2 gap-4">
									<div class="flex flex-col gap-2">
										<div class="flex items-center gap-2">
											<div class="w-1 h-6 bg-amber-600 rounded"></div>
											<div class="text-xs font-medium text-muted-foreground">Start date</div>
										</div>
										<p class="text-sm pl-3">
											{#if viewingCampaign.start_date}
												{formatDateTime(viewingCampaign.start_date)}
											{:else}
												<span class="text-muted-foreground">-</span>
											{/if}
										</p>
									</div>
									<div class="flex flex-col gap-2">
										<div class="flex items-center gap-2">
											<div class="w-1 h-6 bg-amber-600 rounded"></div>
											<div class="text-xs font-medium text-muted-foreground">End date</div>
										</div>
										<p class="text-sm pl-3">
											{#if viewingCampaign.end_date}
												{formatDateTime(viewingCampaign.end_date)}
											{:else}
												<span class="text-muted-foreground">-</span>
											{/if}
										</p>
									</div>
								</div>
							{/if}
						</div>

						<!-- Total used Card -->
						<div class="rounded-lg border bg-card p-6">
							<div class="flex items-center gap-2 mb-4">
								<DollarSign class="size-4 text-muted-foreground" />
								<h3 class="text-sm font-semibold">Total used</h3>
							</div>
							<p class="text-2xl font-semibold">0</p>
						</div>

						<!-- Budget limit per customer Card -->
						<div class="rounded-lg border bg-card p-6">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-4">
										<Clock class="size-4 text-muted-foreground" />
										<h3 class="text-sm font-semibold">Budget limit per customer</h3>
									</div>
									<p class="text-2xl font-semibold">23</p>
								</div>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
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
												textValue="Edit"
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={() => {
													if (viewingCampaign) {
														closeView();
														openEdit(viewingCampaign);
													}
												}}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</div>
						</div>

						<!-- Promotions Card -->
						<div class="rounded-lg border bg-card p-6">
							<div class="flex items-start justify-between mb-4">
								<h3 class="text-sm font-semibold">Promotions</h3>
								{#if viewingCampaign}
									<Button size="sm" onclick={() => openCreatePromotion(viewingCampaign!.id)}>
										Add
									</Button>
								{/if}
							</div>
							{#if campaignPromotions.length === 0}
								<p class="text-sm text-muted-foreground">No promotions associated with this campaign.</p>
							{:else}
								<div class="flex flex-col gap-2">
									{#each campaignPromotions as promotion (promotion.id)}
										<div class="flex items-center justify-between rounded-md border p-3">
											<div class="flex flex-col gap-1">
												<span class="text-sm font-medium">{promotion.code || 'Automatic'}</span>
												<span class="text-xs text-muted-foreground">{promotion.method} • {promotion.status}</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- JSON Card -->
						<div class="rounded-lg border bg-card p-6">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="text-sm font-semibold mb-4">JSON</h3>
									<p class="text-sm text-muted-foreground">11 keys</p>
								</div>
								<button
									class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
									onclick={() => {
										if (viewingCampaign) {
											console.log('View JSON:', viewingCampaign);
										}
									}}
								>
									<ExternalLink class="size-4" />
									<span class="sr-only">View JSON</span>
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeView}>Close</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Create Promotion Sheet -->
<Sheet.Root bind:open={createPromotionOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<!-- Header: close + step indicator -->
			<Sheet.Header class="flex flex-col gap-4 border-b px-8 py-4">
				<div class="flex items-center gap-2 pt-[10px]">
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createPromotionStep >= 1 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createPromotionStep > 1}
								1
							{:else}
								<span class="size-2 rounded-full bg-current"></span>
							{/if}
						</span>
						<span class={cn('text-sm', createPromotionStep === 1 ? 'font-medium' : 'text-muted-foreground')}>Type</span>
					</div>
					<div class="h-px flex-1 bg-border"></div>
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createPromotionStep >= 2 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createPromotionStep === 2}
								<Info class="size-3" />
							{:else}
								2
							{/if}
						</span>
						<span class={cn('text-sm', createPromotionStep === 2 ? 'font-medium' : 'text-muted-foreground')}>Details</span>
					</div>
				</div>
			</Sheet.Header>

			<!-- Step content -->
			<div class="flex-1 overflow-auto px-6 py-6">
				{#if createPromotionStep === 1}
					<h2 class="text-lg font-semibold">Type</h2>
					<div class="mt-4 flex flex-col gap-1">
						{#each PROMOTION_TYPES as type (type.id)}
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									createPromotionType === type.id
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="promotion-type"
									value={type.id}
									checked={createPromotionType === type.id}
									onchange={() => (createPromotionType = type.id)}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div class="min-w-0 flex-1">
									<span class="font-medium">{type.label}</span>
									<p class="mt-0.5 text-sm text-muted-foreground">{type.description}</p>
								</div>
							</label>
						{/each}
					</div>
				{:else if createPromotionStep === 2}
					<div class="flex items-center gap-2">
						<h2 class="text-lg font-semibold">Promotion Details</h2>
						<span class="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
							{typeLabel}
						</span>
					</div>

					<div class="mt-6 flex flex-col gap-6">
						<!-- Method -->
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Method</span>
							<div class="flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										detailMethod === 'promotion_code' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="detail-method"
										value="promotion_code"
										checked={detailMethod === 'promotion_code'}
										onchange={() => (detailMethod = 'promotion_code')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Promotion code</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Customers must enter this code at checkout
										</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										detailMethod === 'automatic' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="detail-method"
										value="automatic"
										checked={detailMethod === 'automatic'}
										onchange={() => (detailMethod = 'automatic')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Automatic</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Customers will see this promotion at checkout
										</p>
									</div>
								</label>
							</div>
						</div>

						<!-- Status -->
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Status</span>
							<div class="flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										detailStatus === 'draft' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="detail-status"
										value="draft"
										checked={detailStatus === 'draft'}
										onchange={() => (detailStatus = 'draft')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Draft</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Customers will not be able to use the code yet
										</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										detailStatus === 'active' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="detail-status"
										value="active"
										checked={detailStatus === 'active'}
										onchange={() => (detailStatus = 'active')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Active</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Customers will be able to use the code
										</p>
									</div>
								</label>
							</div>
						</div>

						<!-- Code (only when Promotion code method) -->
						{#if detailMethod === 'promotion_code'}
							<div class="flex flex-col gap-2">
								<label for="detail-code" class="text-sm font-medium">Code</label>
								<Input
									id="detail-code"
									bind:value={detailCode}
									placeholder="e.g. SUMMER15"
									class="h-9"
								/>
								<p class="text-xs text-muted-foreground">
									The code your customers will enter during checkout.
								</p>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">
								No code required—promotion applies automatically at checkout.
							</p>
						{/if}

						<!-- Value, Currency, Max Quantity (for applicable promotion types) -->
						{#if !isFreeShipping && !isBuyXGetY}
							<div class="rounded-lg border bg-muted/30 p-4">
								<div class="flex flex-col gap-4">
									{#if isPercentageType}
										<div class="flex flex-col gap-2">
											<label for="detail-promotion-value" class="text-sm font-medium">Percentage</label>
											<div class="flex items-center gap-2">
												<Input
													id="detail-promotion-value"
													type="number"
													bind:value={detailPromotionValue}
													placeholder="e.g. 15"
													class="h-9"
													min="0"
													max="100"
												/>
												<span class="text-sm text-muted-foreground">%</span>
											</div>
										</div>
									{:else}
										<div class="grid grid-cols-2 gap-4">
											<div class="flex flex-col gap-2">
												<label for="detail-promotion-value" class="text-sm font-medium">Value</label>
												<Input
													id="detail-promotion-value"
													type="number"
													bind:value={detailPromotionValue}
													placeholder="e.g. 10"
													class="h-9"
													min="0"
													step="0.01"
												/>
											</div>
											<div class="flex flex-col gap-2">
												<label for="detail-value-currency" class="text-sm font-medium">Currency</label>
												<select
													id="detail-value-currency"
													bind:value={detailValueCurrency}
													class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
												>
													{#each CURRENCIES as currency}
														<option value={currency.code}>{currency.code} - {currency.name}</option>
													{/each}
												</select>
											</div>
										</div>
									{/if}
									<div class="flex flex-col gap-2">
										<label for="detail-max-quantity" class="text-sm font-medium">Max Quantity</label>
										<Input
											id="detail-max-quantity"
											type="number"
											bind:value={detailMaxQuantity}
											placeholder="1"
											class="h-9"
											min="1"
										/>
										<p class="text-xs text-muted-foreground">
											Maximum number of times this promotion can be applied.
										</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- Campaign info (read-only) -->
						<div class="rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm">
							<span class="font-medium">Campaign:</span>
							<span class="ml-2">
								{campaigns.find(c => c.id === createPromotionCampaignId)?.name || 'Unknown'}
							</span>
						</div>
					</div>
				{/if}
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreatePromotion}>Cancel</Button>
				{#if createPromotionStep === 1}
					<Button onclick={goToPromotionDetails}>Continue</Button>
				{:else if createPromotionStep === 2}
					<Button variant="outline" onclick={() => (createPromotionStep = 1)}>Back</Button>
					<Button onclick={savePromotion}>Save</Button>
				{/if}
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="campaign"
	entityTitle={campaignToDelete?.name ?? ''}
	onConfirm={handleConfirmDelete}
	onCancel={() => (campaignToDelete = null)}
/>
