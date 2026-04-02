<script lang="ts">
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { CampaignDetail } from '../detail/types.js';
	import Clock from '@lucide/svelte/icons/clock';

	type Props = {
		open?: boolean;
		campaign: CampaignDetail | null;
		onSaved?: () => void | Promise<void>;
	};

	let { open = $bindable(false), campaign, onSaved }: Props = $props();

	let name = $state('');
	let identifier = $state('');
	let description = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let error = $state<string | null>(null);

	function syncFromCampaign(c: CampaignDetail) {
		name = c.name;
		identifier = c.identifier;
		description = c.description || '';
		startDate = c.start_date ? new Date(c.start_date).toISOString().slice(0, 16) : '';
		endDate = c.end_date ? new Date(c.end_date).toISOString().slice(0, 16) : '';
		error = null;
	}

	$effect(() => {
		if (open && campaign) {
			syncFromCampaign(campaign);
		}
	});

	$effect(() => {
		if (open && !campaign) {
			open = false;
		}
	});

	function close() {
		open = false;
	}

	async function save() {
		if (!campaign) return;
		error = null;
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}
		if (!identifier.trim()) {
			error = 'Identifier is required';
			return;
		}
		await client['campaigns']({ id: campaign.id }).put({
			name: name.trim(),
			identifier: identifier.trim(),
			description: description.trim() || null,
			start_date: startDate || null,
			end_date: endDate || null
		});
		open = false;
		await onSaved?.();
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Edit Campaign</h2>
				<p class="text-sm text-muted-foreground">Edit campaign details.</p>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if error}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-campaign-name" class="text-sm font-medium">Name</label>
							<Input
								id="edit-campaign-name"
								bind:value={name}
								placeholder="e.g. Summer Sale"
								class="h-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-campaign-identifier" class="text-sm font-medium">Identifier</label>
							<Input
								id="edit-campaign-identifier"
								bind:value={identifier}
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
							bind:value={description}
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
									bind:value={startDate}
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
									bind:value={endDate}
									class="h-9 w-full pl-[18px]"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button onclick={save}>Save</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
