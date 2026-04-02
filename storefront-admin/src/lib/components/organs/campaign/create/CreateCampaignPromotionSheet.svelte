<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Info from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';

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

	type SavePayload = {
		code: string;
		method: 'Automatic' | 'Manual';
		status: 'Active' | 'Draft' | 'Inactive';
		campaign_id: string | null;
	};

	type Props = {
		open?: boolean;
		campaignId?: string | null;
		campaignName?: string;
		onSave?: (payload: SavePayload) => Promise<void>;
	};

	let {
		open = $bindable(false),
		campaignId = null,
		campaignName = 'Unknown',
		onSave
	}: Props = $props();

	let createPromotionStep = $state(1);
	let createPromotionType = $state<PromotionTypeId>('amount_off_products');
	let detailMethod = $state<'promotion_code' | 'automatic'>('promotion_code');
	let detailStatus = $state<'draft' | 'active'>('draft');
	let detailCode = $state('');
	let detailPromotionValue = $state('');
	let detailMaxQuantity = $state<number | ''>(1);
	let detailValueCurrency = $state('USD');

	const typeLabel = $derived(
		PROMOTION_TYPES.find((t) => t.id === createPromotionType)?.label ?? createPromotionType
	);
	const isPercentageType = $derived(
		createPromotionType === 'percentage_off_product' ||
			createPromotionType === 'percentage_off_order'
	);
	const isBuyXGetY = $derived(createPromotionType === 'buy_x_get_y');
	const isFreeShipping = $derived(createPromotionType === 'free_shipping');

	function resetForm() {
		createPromotionStep = 1;
		createPromotionType = 'amount_off_products';
		detailMethod = 'promotion_code';
		detailStatus = 'draft';
		detailCode = '';
		detailPromotionValue = '';
		detailValueCurrency = 'USD';
		detailMaxQuantity = 1;
	}

	$effect(() => {
		if (open && campaignId) {
			resetForm();
		}
	});

	function closeSheet() {
		open = false;
	}

	function goToPromotionDetails() {
		createPromotionStep = 2;
	}

	async function savePromotion() {
		if (detailMethod === 'promotion_code' && !detailCode.trim()) {
			return;
		}
		if (!onSave) return;

		await onSave({
			code: detailMethod === 'promotion_code' ? detailCode.trim() : '',
			method: detailMethod === 'automatic' ? 'Automatic' : 'Manual',
			status:
				detailStatus === 'active' ? 'Active' : detailStatus === 'draft' ? 'Draft' : 'Inactive',
			campaign_id: campaignId
		});
		closeSheet();
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-4 border-b px-8 py-4">
				<div class="flex items-center gap-2 pt-[10px]">
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createPromotionStep >= 1
									? 'bg-primary text-primary-foreground'
									: 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createPromotionStep > 1}
								1
							{:else}
								<span class="size-2 rounded-full bg-current"></span>
							{/if}
						</span>
						<span
							class={cn(
								'text-sm',
								createPromotionStep === 1 ? 'font-medium' : 'text-muted-foreground'
							)}>Type</span
						>
					</div>
					<div class="h-px flex-1 bg-border"></div>
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-5 items-center justify-center rounded-full text-xs',
								createPromotionStep >= 2
									? 'bg-primary text-primary-foreground'
									: 'border border-input bg-background'
							)}
							aria-hidden="true"
						>
							{#if createPromotionStep === 2}
								<Info class="size-3" />
							{:else}
								2
							{/if}
						</span>
						<span
							class={cn(
								'text-sm',
								createPromotionStep === 2 ? 'font-medium' : 'text-muted-foreground'
							)}>Details</span
						>
					</div>
				</div>
			</Sheet.Header>

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
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Method</span>
							<div class="flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										detailMethod === 'promotion_code'
											? 'border-primary bg-primary/5'
											: 'border-input hover:bg-muted/30'
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
										detailMethod === 'automatic'
											? 'border-primary bg-primary/5'
											: 'border-input hover:bg-muted/30'
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

						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Status</span>
							<div class="flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										detailStatus === 'draft'
											? 'border-primary bg-primary/5'
											: 'border-input hover:bg-muted/30'
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
										detailStatus === 'active'
											? 'border-primary bg-primary/5'
											: 'border-input hover:bg-muted/30'
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

						{#if !isFreeShipping && !isBuyXGetY}
							<div class="rounded-lg border bg-muted/30 p-4">
								<div class="flex flex-col gap-4">
									{#if isPercentageType}
										<div class="flex flex-col gap-2">
											<label for="detail-promotion-value" class="text-sm font-medium"
												>Percentage</label
											>
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
												<label for="detail-promotion-value" class="text-sm font-medium">Value</label
												>
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
												<label for="detail-value-currency" class="text-sm font-medium"
													>Currency</label
												>
												<select
													id="detail-value-currency"
													bind:value={detailValueCurrency}
													class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
												>
													{#each CURRENCIES as currency (currency.code)}
														<option value={currency.code}>{currency.code} - {currency.name}</option>
													{/each}
												</select>
											</div>
										</div>
									{/if}
									<div class="flex flex-col gap-2">
										<label for="detail-max-quantity" class="text-sm font-medium">Max Quantity</label
										>
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

						<div class="rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm">
							<span class="font-medium">Campaign:</span>
							<span class="ml-2">
								{campaignName}
							</span>
						</div>
					</div>
				{/if}
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet}>Cancel</Button>
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
