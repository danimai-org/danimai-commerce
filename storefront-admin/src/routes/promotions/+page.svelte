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
	import Info from '@lucide/svelte/icons/info';
	import Clock from '@lucide/svelte/icons/clock';
	import { cn } from '$lib/utils.js';

	type Promotion = {
		id: string;
		code: string;
		method: 'Automatic' | 'Manual';
		status: 'Active' | 'Inactive' | 'Draft';
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
	let searchQuery = $state('');
	let page = $state(1);
	const limit = 10;

	const filtered = $derived(
		searchQuery.trim()
			? promotions.filter(
					(p) =>
						p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
						p.method.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: promotions
	);
	const total = $derived(filtered.length);
	const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	const start = $derived((page - 1) * limit + 1);
	const end = $derived(Math.min(page * limit, total));
	const pageData = $derived(filtered.slice((page - 1) * limit, page * limit));

	// Create promotion flow
	let createOpen = $state(false);
	let createStep = $state(1);
	let createType = $state<PromotionTypeId>('amount_off_products');

	// Edit promotion flow
	let editOpen = $state(false);
	let editingPromotion = $state<Promotion | null>(null);
	let editCode = $state('');
	let editMethod = $state<'promotion_code' | 'automatic'>('promotion_code');
	let editStatus = $state<'draft' | 'active' | 'inactive'>('draft');

	// Delete confirmation
	let deleteModalOpen = $state(false);
	let promotionToDelete = $state<Promotion | null>(null);

	// Step 2 - Details (for "Amount off products" and similar)
	let detailMethod = $state<'promotion_code' | 'automatic'>('promotion_code');
	let detailStatus = $state<'draft' | 'active'>('draft');
	let detailCode = $state('SUMMER15');
	let detailIncludeTaxes = $state(false);
	let detailPromotionValue = $state('');
	let detailMaxQuantity = $state<number | ''>(1);
	type CodeCondition = { id: string; field: string; op: string; value: string };
	let detailCodeConditions = $state<CodeCondition[]>([]);
	let detailItemConditions = $state<CodeCondition[]>([]);
	let detailCartConditions = $state<CodeCondition[]>([]);
	let detailShippingConditions = $state<CodeCondition[]>([]);

	// Step 3 - Campaign
	let campaignChoice = $state<'without' | 'existing' | 'new'>('new');
	let campaignName = $state('');
	let campaignIdentifier = $state('');
	let campaignDescription = $state('');
	let campaignStartDate = $state('');
	let campaignEndDate = $state('');
	let campaignBudgetType = $state<'usage' | 'spend'>('usage');
	let campaignBudgetLimit = $state<number | ''>('');

	const typeLabel = $derived(PROMOTION_TYPES.find((t) => t.id === createType)?.label ?? createType);
	const isPercentageType = $derived(
		createType === 'percentage_off_product' || createType === 'percentage_off_order'
	);
	const isBuyXGetY = $derived(createType === 'buy_x_get_y');
	const isFreeShipping = $derived(createType === 'free_shipping');

	const CURRENCIES = [
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'INR', name: 'Indian Rupee', symbol: '₹' },
		{ code: 'EUR', name: 'Euro', symbol: '€' },
		{ code: 'GBP', name: 'British Pound', symbol: '£' }
	] as const;
	let detailValueCurrency = $state('USD');

	function openCreate() {
		createOpen = true;
		createStep = 1;
		createType = 'amount_off_products';
		detailMethod = 'promotion_code';
		detailStatus = 'draft';
		detailCode = 'SUMMER15';
		detailIncludeTaxes = false;
		detailPromotionValue = '';
		detailValueCurrency = 'USD';
		detailMaxQuantity = 1;
		detailCodeConditions = [];
		detailItemConditions = [];
		detailCartConditions = [];
		detailShippingConditions = [];
		campaignChoice = 'new';
		campaignName = '';
		campaignIdentifier = '';
		campaignDescription = '';
		campaignStartDate = '';
		campaignEndDate = '';
		campaignBudgetType = 'usage';
		campaignBudgetLimit = '';
	}

	function closeCreate() {
		createOpen = false;
	}

	function goToDetails() {
		createStep = 2;
	}

	function goToCampaign() {
		createStep = 3;
	}

	function savePromotion() {
		// Validate required fields
		if (detailMethod === 'promotion_code' && !detailCode.trim()) {
			// Code is required for promotion_code method
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
						: 'Inactive'
		};

		// Add to promotions array
		promotions = [...promotions, newPromotion];
		savePromotionsToStorage(promotions);

		// Close the create sheet
		closeCreate();
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

	function openEdit(p: Promotion) {
		editingPromotion = p;
		editCode = p.code;
		editMethod = p.method === 'Manual' ? 'promotion_code' : 'automatic';
		editStatus =
			p.status === 'Active' ? 'active' : p.status === 'Inactive' ? 'inactive' : 'draft';
		editOpen = true;
	}

	function closeEdit() {
		editOpen = false;
		editingPromotion = null;
	}

	function saveEdit() {
		if (!editingPromotion) return;
		promotions = promotions.map((x) =>
			x.id === editingPromotion!.id
				? {
						...x,
						code: editCode,
						method: editMethod === 'promotion_code' ? 'Manual' : 'Automatic',
						status:
							editStatus === 'active'
								? 'Active'
								: editStatus === 'inactive'
									? 'Inactive'
									: 'Draft'
					}
				: x
		);
		savePromotionsToStorage(promotions);
		closeEdit();
	}

	$effect(() => {
		if (!editOpen) editingPromotion = null;
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
		}
	}
</script>

<svelte:head>
	<title>Promotions | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-foreground">Promotions</span>
			</div>
		</div>
		<div class="mb-4 flex flex-col gap-4">
			<div class="flex items-center justify-between gap-4">
				<h1 class="text-xl font-semibold">Promotions</h1>
				<Button size="sm" onclick={openCreate}>Create</Button>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2">
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
		</div>

		<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
			<table class="w-full text-sm">
				<thead class="sticky top-0 border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Code</th>
						<th class="px-4 py-3 text-left font-medium">Method</th>
						<th class="px-4 py-3 text-left font-medium">Status</th>
						<th class="w-10 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#if pageData.length === 0}
						<tr>
							<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
								No promotions found.
							</td>
						</tr>
					{:else}
						{#each pageData as promotion (promotion.id)}
							<tr class="border-b transition-colors hover:bg-muted/30">
								<td class="px-4 py-3">
									<button
										type="button"
										class="font-medium text-foreground hover:underline"
										onclick={() => openEdit(promotion)}
									>
										{promotion.code}
									</button>
								</td>
								<td class="px-4 py-3 text-muted-foreground">{promotion.method}</td>
								<td class="px-4 py-3">
									<span
										class={cn(
											'inline-flex items-center gap-1.5 capitalize',
											promotion.status === 'Active' && 'text-green-600 dark:text-green-400',
											promotion.status === 'Inactive' && 'text-muted-foreground',
											promotion.status === 'Draft' && 'text-amber-600 dark:text-amber-400'
										)}
									>
										{#if promotion.status === 'Active'}
											<span
												class="size-2 shrink-0 rounded-full bg-green-500"
												aria-hidden="true"
											></span>
										{:else if promotion.status === 'Draft'}
											<span
												class="size-2 shrink-0 rounded-full bg-amber-500"
												aria-hidden="true"
											></span>
										{:else if promotion.status === 'Inactive'}
											<span
												class="size-2 shrink-0 rounded-full bg-muted-foreground"
												aria-hidden="true"
											></span>
										{/if}
										{promotion.status}
									</span>
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
													onSelect={() => openEdit(promotion)}
												>
													<Pencil class="size-4" />
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Item
													textValue="Delete"
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
													onSelect={() => openDeleteModal(promotion)}
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
				<Button
					variant="outline"
					size="sm"
					disabled={page <= 1}
					onclick={() => (page = page - 1)}
				>
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

<!-- Create Promotion Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<!-- Header: close + step indicator -->
			<Sheet.Header class="flex flex-col gap-4 border-b px-6 py-4">
				<div class="flex items-center gap-2">
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createStep >= 1 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createStep > 1}
								1
							{:else}
								<span class="size-2 rounded-full bg-current"></span>
							{/if}
						</span>
						<span class={cn('text-sm', createStep === 1 ? 'font-medium' : 'text-muted-foreground')}>Type</span>
					</div>
					<div class="h-px flex-1 bg-border"></div>
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createStep >= 2 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createStep > 2}
								2
							{:else if createStep === 2}
								<Info class="size-3" />
							{:else}
								2
							{/if}
						</span>
						<span class={cn('text-sm', createStep === 2 ? 'font-medium' : 'text-muted-foreground')}>Details</span>
					</div>
					<div class="h-px flex-1 bg-border"></div>
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createStep >= 3 ? 'bg-primary text-primary-foreground' : 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createStep === 3}
								<Info class="size-3" />
							{:else}
								3
							{/if}
						</span>
						<span class={cn('text-sm', createStep === 3 ? 'font-medium' : 'text-muted-foreground')}>Campaign</span>
					</div>
				</div>
			</Sheet.Header>

			<!-- Step content -->
			<div class="flex-1 overflow-auto px-6 py-6">
				{#if createStep === 1}
					<h2 class="text-lg font-semibold">Type</h2>
					<div class="mt-4 flex flex-col gap-1">
						{#each PROMOTION_TYPES as type (type.id)}
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									createType === type.id
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="promotion-type"
									value={type.id}
									checked={createType === type.id}
									onchange={() => (createType = type.id)}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div class="min-w-0 flex-1">
									<span class="font-medium">{type.label}</span>
									<p class="mt-0.5 text-sm text-muted-foreground">{type.description}</p>
								</div>
							</label>
						{/each}
					</div>
				{:else if createStep === 2}
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

						<!-- Does promotion include taxes? -->
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Does promotion include taxes?</span>
							<div class="flex items-center gap-2">
								<button
									type="button"
									role="switch"
									aria-checked={detailIncludeTaxes}
									aria-label="Apply promotion after taxes"
									class={cn(
										'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										detailIncludeTaxes ? 'bg-primary' : 'bg-input'
									)}
									onclick={() => (detailIncludeTaxes = !detailIncludeTaxes)}
								>
									<span
										class={cn(
											'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
											detailIncludeTaxes ? 'translate-x-5' : 'translate-x-[1px]'
										)}
									></span>
								</button>
								<span class="text-sm text-muted-foreground">
									Enable this field to apply the promotion after taxes
								</span>
							</div>
						</div>

						<!-- Who can use this code? -->
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Who can use this code?</span>
							<p class="text-sm text-muted-foreground">
								Which customer is allowed to use the promotion code? Promotion code can be used by all customers if left untouched.
							</p>
						</div>

						<!-- Promotion Code Conditions -->
						<div class="flex flex-col gap-2">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">Promotion Code Conditions</span>
								<span class="text-xs text-muted-foreground">Required</span>
							</div>
							{#each detailCodeConditions as cond (cond.id)}
								<div class="flex flex-wrap items-center gap-2">
									<select
										class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
										bind:value={cond.field}
									>
										<option value="currency_code">Currency Code</option>
										<option value="customer_group">Customer group</option>
									</select>
									<select
										class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
										bind:value={cond.op}
									>
										<option value="equals">Equals</option>
										<option value="in">In</option>
									</select>
									{#if cond.field === 'currency_code'}
										<select
											class="flex h-9 min-w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
											bind:value={cond.value}
										>
											<option value="">Select value</option>
											{#each CURRENCIES as cur}
												<option value={cur.code}>{cur.name}</option>
											{/each}
										</select>
									{:else}
										<Input
											class="h-9 w-32"
											placeholder="Select value"
											bind:value={cond.value}
										/>
									{/if}
									<Button type="button" variant="ghost" size="icon" class="size-9" onclick={() => removeCodeCondition(cond.id)}>
										×
									</Button>
								</div>
							{/each}
							<div class="flex gap-2">
								<Button type="button" variant="outline" size="sm" onclick={addCodeCondition}>
									Add condition
								</Button>
								<Button type="button" variant="ghost" size="sm" onclick={clearCodeConditions}>
									Clear all
								</Button>
							</div>
						</div>

						<!-- Promotion Value (hidden for Free shipping) -->
						{#if !isFreeShipping}
						<div class="flex flex-col gap-2">
							<label for="detail-value" class="flex items-center gap-1.5 text-sm font-medium">
								Promotion Value
								<span class="text-muted-foreground" title={isPercentageType ? 'The percentage to discount' : 'The amount to discount'}>ⓘ</span>
							</label>
							{#if isPercentageType}
								<div class="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 shadow-xs focus-within:ring-2 focus-within:ring-ring">
									<Input
										id="detail-value"
										type="number"
										min="0"
										max="100"
										step="0.5"
										bind:value={detailPromotionValue}
										placeholder="0"
										class="h-8 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
									/>
									<span class="text-sm text-muted-foreground">%</span>
								</div>
								<p class="text-xs text-muted-foreground">The percentage to discount off the amount. e.g. 8%</p>
							{:else}
								<div class="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 shadow-xs focus-within:ring-2 focus-within:ring-ring">
									<select
										class="h-8 border-0 bg-transparent pr-2 text-sm outline-none focus:ring-0"
										bind:value={detailValueCurrency}
									>
										{#each CURRENCIES as cur}
											<option value={cur.code}>{cur.code}</option>
										{/each}
									</select>
									<Input
										id="detail-value-amount"
										type="number"
										min="0"
										step="0.01"
										bind:value={detailPromotionValue}
										placeholder="0.00"
										class="h-8 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
									/>
									<span class="text-sm text-muted-foreground">
										{CURRENCIES.find((c) => c.code === detailValueCurrency)?.symbol ?? '$'}
									</span>
								</div>
								<p class="text-xs text-muted-foreground">The amount to be discounted. e.g. 100</p>
							{/if}
						</div>
						{/if}

						<!-- Maximum Quantity (hidden for Free shipping) -->
						{#if !isFreeShipping}
						<div class="flex flex-col gap-2">
							<label for="detail-max-qty" class="text-sm font-medium">Maximum Quantity</label>
							<Input
								id="detail-max-qty"
								type="number"
								min="1"
								bind:value={detailMaxQuantity}
								class="h-9 w-24"
							/>
							<p class="text-xs text-muted-foreground">
								Maximum quantity of items this promotion applies to.
							</p>
						</div>
						{/if}

						<!-- What shipping methods will the promotion be applied to? (Free shipping) -->
						{#if isFreeShipping}
							<div class="flex flex-col gap-3">
								<span class="text-sm font-medium">What shipping methods will the promotion be applied to?</span>
								<p class="text-sm text-muted-foreground">
									The promotion will be applied to shipping methods that match the following conditions.
								</p>
								{#each detailShippingConditions as cond, i (cond.id)}
									{#if i > 0}
										<span class="text-xs font-medium text-muted-foreground">AND</span>
									{/if}
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-xs text-muted-foreground">Required</span>
										<select
											class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
											bind:value={cond.field}
										>
											<option value="shipping_method">Shipping method</option>
										</select>
										<select
											class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
											bind:value={cond.op}
										>
											<option value="equals">Equals</option>
										</select>
										<Button type="button" variant="outline" size="sm" class="h-9">
											Select Value
										</Button>
										<Button type="button" variant="ghost" size="icon" class="size-9" onclick={() => removeShippingCondition(cond.id)}>
											×
										</Button>
									</div>
								{/each}
								<div class="flex gap-2">
									<Button type="button" variant="outline" size="sm" onclick={addShippingCondition}>
										Add condition
									</Button>
									<Button type="button" variant="ghost" size="sm" onclick={clearShippingConditions}>
										Clear all
									</Button>
								</div>
							</div>
						{/if}

						<!-- What needs to be in the cart to unlock the promotion? (Buy X Get Y) -->
						{#if isBuyXGetY}
							<div class="flex flex-col gap-3">
								<span class="text-sm font-medium">What needs to be in the cart to unlock the promotion?</span>
								<p class="text-sm text-muted-foreground">
									If these conditions match, we enable the promotion on the target items.
								</p>
								{#each detailCartConditions as cond, i (cond.id)}
									{#if i > 0}
										<span class="text-xs font-medium text-muted-foreground">AND</span>
									{/if}
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-xs text-muted-foreground">Required</span>
										<select
											class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
											bind:value={cond.field}
										>
											<option value="minimum_quantity_of_items">Minimum quantity of items</option>
											<option value="product">Product</option>
										</select>
										<select
											class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
											bind:value={cond.op}
										>
											<option value="equals">Equals</option>
										</select>
										{#if cond.field === 'minimum_quantity_of_items'}
											<Input
												type="number"
												min="0"
												bind:value={cond.value}
												class="h-9 w-24"
											/>
										{:else}
											<Button type="button" variant="outline" size="sm" class="h-9">
												Select Value
											</Button>
										{/if}
										<Button type="button" variant="ghost" size="icon" class="size-9" onclick={() => removeCartCondition(cond.id)}>
											×
										</Button>
									</div>
								{/each}
								<div class="flex gap-2">
									<Button type="button" variant="outline" size="sm" onclick={addCartCondition}>
										Add condition
									</Button>
									<Button type="button" variant="ghost" size="sm" onclick={clearCartConditions}>
										Clear all
									</Button>
								</div>
							</div>
						{/if}

						<!-- What items will the promotion be applied to? (hidden for Free shipping) -->
						{#if !isFreeShipping}
						<div class="flex flex-col gap-3">
							<span class="text-sm font-medium">What items will the promotion be applied to?</span>
							<p class="text-sm text-muted-foreground">
								The promotion will be applied to items that match the following conditions.
							</p>
							{#each detailItemConditions as cond, i (cond.id)}
								{#if i > 0}
									<span class="text-xs font-medium text-muted-foreground">AND</span>
								{/if}
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-xs text-muted-foreground">Required</span>
									<select
										class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
										bind:value={cond.field}
									>
										<option value="quantity_promotion_applies_to">Quantity of items promotion will apply to</option>
										<option value="product">Product</option>
									</select>
									<select
										class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
										bind:value={cond.op}
									>
										<option value="equals">Equals</option>
									</select>
									{#if cond.field === 'quantity_promotion_applies_to'}
										<Input
											type="number"
											min="0"
											bind:value={cond.value}
											class="h-9 w-24"
										/>
									{:else}
										<Button type="button" variant="outline" size="sm" class="h-9">
											Select Value
										</Button>
									{/if}
									<Button type="button" variant="ghost" size="icon" class="size-9" onclick={() => removeItemCondition(cond.id)}>
										×
									</Button>
								</div>
							{/each}
							<div class="flex gap-2">
								<Button type="button" variant="outline" size="sm" onclick={addItemCondition}>
									Add condition
								</Button>
								<Button type="button" variant="ghost" size="sm" onclick={clearItemConditions}>
									Clear all
								</Button>
							</div>
						</div>
						{/if}
					</div>
				{:else}
					<!-- Step 3: Campaign -->
					<div class="flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Campaign</span>
							<div class="flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										campaignChoice === 'without' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="campaign-choice"
										value="without"
										checked={campaignChoice === 'without'}
										onchange={() => (campaignChoice = 'without')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Without Campaign</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Proceed without associating promotion with campaign.
										</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										campaignChoice === 'existing' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="campaign-choice"
										value="existing"
										checked={campaignChoice === 'existing'}
										onchange={() => (campaignChoice = 'existing')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Existing Campaign</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Add promotion to an existing campaign.
										</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										campaignChoice === 'new' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="campaign-choice"
										value="new"
										checked={campaignChoice === 'new'}
										onchange={() => (campaignChoice = 'new')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">New Campaign</span>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Create a new campaign for this promotion.
										</p>
									</div>
								</label>
							</div>
						</div>

						{#if campaignChoice === 'existing'}
							<div class="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
								Select an existing campaign (dropdown when API available).
							</div>
						{/if}

						{#if campaignChoice === 'new'}
							<div class="flex flex-col gap-6 border-t pt-6">
								<div>
									<h3 class="text-sm font-semibold">Create Campaign</h3>
									<p class="mt-0.5 text-sm text-muted-foreground">Create a promotional campaign.</p>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div class="flex flex-col gap-2">
										<label for="campaign-name" class="text-sm font-medium">Name</label>
										<Input
											id="campaign-name"
											bind:value={campaignName}
											placeholder="e.g. Summer Sale"
											class="h-9"
										/>
									</div>
									<div class="flex flex-col gap-2">
										<label for="campaign-identifier" class="text-sm font-medium">Identifier</label>
										<Input
											id="campaign-identifier"
											bind:value={campaignIdentifier}
											placeholder="e.g. SUMMER24"
											class="h-9"
										/>
									</div>
								</div>
								<div class="flex flex-col gap-2">
									<label for="campaign-description" class="text-sm font-medium">
										Description <span class="font-normal text-muted-foreground">(Optional)</span>
									</label>
									<textarea
										id="campaign-description"
										bind:value={campaignDescription}
										rows="3"
										class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
										placeholder="Campaign description"
									></textarea>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div class="flex flex-col gap-2">
										<label for="campaign-start" class="text-sm font-medium">
											Start date <span class="font-normal text-muted-foreground">(Optional)</span>
										</label>
										<div class="relative">
											<Clock class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												id="campaign-start"
												type="datetime-local"
												bind:value={campaignStartDate}
												class="h-9 pl-[18px]"
											/>
										</div>
									</div>
									<div class="flex flex-col gap-2">
										<label for="campaign-end" class="text-sm font-medium">
											End date <span class="font-normal text-muted-foreground">(Optional)</span>
										</label>
										<div class="relative">
											<Clock class="absolute top-1/2 left-[3px] size-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												id="campaign-end"
												type="datetime-local"
												bind:value={campaignEndDate}
												class="h-9 pl-[18px]"
											/>
										</div>
									</div>
								</div>

								<!-- Campaign Budget -->
								<div class="flex flex-col gap-4">
									<div>
										<h3 class="text-sm font-semibold">Campaign Budget</h3>
										<p class="mt-0.5 text-sm text-muted-foreground">Create a budget for the campaign.</p>
									</div>
									<div class="flex flex-col gap-2">
										<span class="text-sm font-medium">Type</span>
										<div class="flex flex-col gap-2">
											<label
												class={cn(
													'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
													campaignBudgetType === 'usage' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
												)}
											>
												<input
													type="radio"
													name="campaign-budget-type"
													value="usage"
													checked={campaignBudgetType === 'usage'}
													onchange={() => (campaignBudgetType = 'usage')}
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
													campaignBudgetType === 'spend' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
												)}
											>
												<input
													type="radio"
													name="campaign-budget-type"
													value="spend"
													checked={campaignBudgetType === 'spend'}
													onchange={() => (campaignBudgetType = 'spend')}
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
										<label for="campaign-budget-limit" class="text-sm font-medium">Limit</label>
										<Input
											id="campaign-budget-limit"
											type="number"
											min="0"
											step={campaignBudgetType === 'usage' ? 1 : 0.01}
											bind:value={campaignBudgetLimit}
											placeholder={campaignBudgetType === 'usage' ? 'e.g. 100' : 'e.g. 1000'}
											class="h-9"
										/>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				{#if createStep === 1}
					<Button onclick={goToDetails}>Continue</Button>
				{:else if createStep === 2}
					<Button variant="outline" onclick={() => (createStep = 1)}>Back</Button>
					<Button onclick={goToCampaign}>Continue</Button>
				{:else}
					<Button variant="outline" onclick={() => (createStep = 2)}>Back</Button>
					<Button onclick={savePromotion}>Save</Button>
				{/if}
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Promotion Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-4 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Edit promotion</h2>
			</Sheet.Header>
			<div class="flex-1 overflow-auto px-6 py-6">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<label for="edit-code" class="text-sm font-medium">Code</label>
						<Input
							id="edit-code"
							bind:value={editCode}
							placeholder="e.g. SUMMER15"
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Method</span>
						<div class="flex flex-col gap-2">
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editMethod === 'promotion_code'
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-method"
									value="promotion_code"
									checked={editMethod === 'promotion_code'}
									onchange={() => (editMethod = 'promotion_code')}
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
									editMethod === 'automatic'
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-method"
									value="automatic"
									checked={editMethod === 'automatic'}
									onchange={() => (editMethod = 'automatic')}
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
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Status</span>
						<div class="flex flex-col gap-2">
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editStatus === 'draft'
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-status"
									value="draft"
									checked={editStatus === 'draft'}
									onchange={() => (editStatus = 'draft')}
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
									editStatus === 'active'
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-status"
									value="active"
									checked={editStatus === 'active'}
									onchange={() => (editStatus = 'active')}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div>
									<span class="font-medium">Active</span>
									<p class="mt-0.5 text-sm text-muted-foreground">
										Customers will be able to use the code
									</p>
								</div>
							</label>
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editStatus === 'inactive'
										? 'border-primary bg-primary/5'
										: 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-status"
									value="inactive"
									checked={editStatus === 'inactive'}
									onchange={() => (editStatus = 'inactive')}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div>
									<span class="font-medium">Inactive</span>
									<p class="mt-0.5 text-sm text-muted-foreground">
										Promotion is disabled
									</p>
								</div>
							</label>
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

<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="promotion"
	entityTitle={promotionToDelete?.code ?? ''}
	onConfirm={handleConfirmDelete}
	onCancel={() => (promotionToDelete = null)}
/>
