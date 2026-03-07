<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Folder from '@lucide/svelte/icons/folder';
	import { cn } from '$lib/utils.js';
	import type { Promotion, Campaign } from './types.js';

	let {
		open = $bindable(false),
		promotion = null as Promotion | null,
		campaigns = [] as Campaign[],
		onEdit
	}: {
		open?: boolean;
		promotion: Promotion | null;
		campaigns: Campaign[];
		onEdit?: (p: Promotion) => void;
	} = $props();

	function close() {
		open = false;
	}

	function handleEdit() {
		if (promotion) {
			close();
			onEdit?.(promotion);
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-lg font-semibold">Promotion Details</h2>
						<p class="text-sm text-muted-foreground">View promotion information.</p>
					</div>
					{#if promotion}
						<span
							class={cn(
								'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize',
								promotion.status === 'Active' &&
									'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
								promotion.status === 'Inactive' &&
									'bg-muted text-muted-foreground',
								promotion.status === 'Draft' &&
									'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
							)}
						>
							{#if promotion.status === 'Active'}
								<span class="size-1.5 shrink-0 rounded-full bg-green-500" aria-hidden="true"></span>
							{:else if promotion.status === 'Draft'}
								<span class="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true"></span>
							{:else if promotion.status === 'Inactive'}
								<span class="size-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true"></span>
							{/if}
							{promotion.status}
						</span>
					{/if}
				</div>
			</Sheet.Header>
			<div class="flex-1 overflow-auto px-6 py-6">
				{#if promotion}
					<div class="flex flex-col gap-8">
						<div class="flex flex-col gap-4">
							<h3 class="text-sm font-semibold">Overview</h3>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col gap-2">
									<div class="text-sm font-medium text-muted-foreground">Code</div>
									<p class="text-sm font-medium">{promotion.code || '-'}</p>
								</div>
								<div class="flex flex-col gap-2">
									<div class="text-sm font-medium text-muted-foreground">Method</div>
									<p class="text-sm">{promotion.method}</p>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-4">
							<h3 class="text-sm font-semibold">Configuration</h3>
							<div class="rounded-lg border bg-muted/30 p-4">
								<div class="flex flex-col gap-4">
									<div class="grid grid-cols-2 gap-4">
										<div class="flex flex-col gap-2">
											<div class="text-sm font-medium text-muted-foreground">Type</div>
											<p class="text-sm">-</p>
										</div>
										<div class="flex flex-col gap-2">
											<div class="text-sm font-medium text-muted-foreground">Value</div>
											<p class="text-sm">-</p>
										</div>
									</div>
									<div class="grid grid-cols-2 gap-4">
										<div class="flex flex-col gap-2">
											<div class="text-sm font-medium text-muted-foreground">Currency</div>
											<p class="text-sm">-</p>
										</div>
										<div class="flex flex-col gap-2">
											<div class="text-sm font-medium text-muted-foreground">Max Quantity</div>
											<p class="text-sm">-</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-4">
							<h3 class="text-sm font-semibold">Conditions</h3>
							<div class="flex flex-col gap-4">
								<div class="rounded-lg border bg-muted/30 p-4">
									<div class="flex flex-col gap-2">
										<div class="text-sm font-medium">Code Conditions</div>
										<p class="text-sm text-muted-foreground">No conditions set</p>
									</div>
								</div>
								<div class="rounded-lg border bg-muted/30 p-4">
									<div class="flex flex-col gap-2">
										<div class="text-sm font-medium">Item Conditions</div>
										<p class="text-sm text-muted-foreground">No conditions set</p>
									</div>
								</div>
								<div class="rounded-lg border bg-muted/30 p-4">
									<div class="flex flex-col gap-2">
										<div class="text-sm font-medium">Cart Conditions</div>
										<p class="text-sm text-muted-foreground">No conditions set</p>
									</div>
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-4">
							<h3 class="text-sm font-semibold">Campaign</h3>
							<div class="rounded-lg border bg-muted/30 p-4">
								{#if promotion.campaign_id}
									{@const campaign = campaigns.find((c) => c.id === promotion!.campaign_id)}
									{#if campaign}
										<div class="flex flex-col gap-2">
											<div class="flex items-center gap-2">
												<Folder class="size-4 text-muted-foreground" />
												<span class="text-sm font-medium">{campaign.name}</span>
											</div>
											<p class="text-sm text-muted-foreground">{campaign.identifier}</p>
											{#if campaign.description}
												<p class="text-sm text-muted-foreground">{campaign.description}</p>
											{/if}
										</div>
									{:else}
										<p class="text-sm text-muted-foreground">Campaign not found</p>
									{/if}
								{:else}
									<p class="text-sm text-muted-foreground">No campaign assigned</p>
								{/if}
							</div>
						</div>

						<div class="flex flex-col gap-4">
							<h3 class="text-sm font-semibold">Usage</h3>
							<div class="grid grid-cols-2 gap-4">
								<div class="rounded-lg border bg-muted/30 p-4">
									<div class="flex flex-col gap-1">
										<div class="text-sm font-medium text-muted-foreground">Total Uses</div>
										<p class="text-lg font-semibold">-</p>
									</div>
								</div>
								<div class="rounded-lg border bg-muted/30 p-4">
									<div class="flex flex-col gap-1">
										<div class="text-sm font-medium text-muted-foreground">Total Discount</div>
										<p class="text-lg font-semibold">-</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Close</Button>
				{#if promotion}
					<Button onclick={handleEdit}>Edit</Button>
				{/if}
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
