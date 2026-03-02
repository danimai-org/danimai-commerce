<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';


	import {
		loadPriceLists,
		savePriceLists,
		generateId,
		type PriceList,
		type PriceListType,
		type PriceListStatus
	} from '$lib/price-lists/storage.js';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		mode = 'create',
		list = null as PriceList | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create' | 'edit';
		list?: PriceList | null;
		onSuccess?: () => void;
	} = $props();

	let name = $state('');
	let description = $state('');
	let type = $state<PriceListType>('sale');
	let status = $state<PriceListStatus>('active');
	let startsAt = $state('');
	let endsAt = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			error = null;
			if (mode === 'edit' && list) {
				name = list.name;
				description = list.description ?? '';
				type = list.type;
				status = list.status;
				startsAt = list.starts_at ? list.starts_at.slice(0, 16) : '';
				endsAt = list.ends_at ? list.ends_at.slice(0, 16) : '';
			} else {
				name = '';
				description = '';
				type = 'sale';
				status = 'active';
				startsAt = '';
				endsAt = '';
			}
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		error = null;
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}
		submitting = true;
		try {
			const priceLists = loadPriceLists();
			if (mode === 'edit' && list) {
				const now = new Date().toISOString();
				const updated = priceLists.map((p) =>
					p.id === list!.id
						? {
								...p,
								name: name.trim(),
								description: description.trim() || null,
								type,
								status,
								starts_at: startsAt.trim() || null,
								ends_at: endsAt.trim() || null,
								updated_at: now
							}
						: p
				);
				savePriceLists(updated);
			} else {
				const now = new Date().toISOString();
				const newList: PriceList = {
					id: generateId(),
					name: name.trim(),
					description: description.trim() || null,
					type,
					status,
					starts_at: startsAt.trim() || null,
					ends_at: endsAt.trim() || null,
					created_at: now,
					updated_at: now
				};
				savePriceLists([...priceLists, newList]);
			}
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const title = $derived(mode === 'edit' ? 'Edit price list' : 'Create price list');
	const subtitle = $derived(
		mode === 'edit' ? 'Update name, type, status, and dates.' : 'Add a new price list.'
	);
	const submitLabel = $derived(
		submitting ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save' : 'Create'
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				{#if error && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="pl-name" class="text-sm font-medium">Name</label>
						<Input
							id="pl-name"
							bind:value={name}
							placeholder="e.g. Summer Sale 2025"
							class={cn('h-9', error === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-description" class="text-sm font-medium">Description (optional)</label>
						<Input
							id="pl-description"
							bind:value={description}
							placeholder="Short description"
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-type" class="text-sm font-medium">Type</label>
						<Select.Root
							type="single"
							value={type}
							onValueChange={(v) => v && (type = v as PriceListType)}
						>
							<Select.Trigger id="pl-type" class="h-9 w-full">
								{type === 'sale' ? 'Sale' : 'Override'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="sale" label="Sale">Sale</Select.Item>
								<Select.Item value="override" label="Override">Override</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-status" class="text-sm font-medium">Status</label>
						<Select.Root
							type="single"
							value={status}
							onValueChange={(v) => v && (status = v as PriceListStatus)}
						>
							<Select.Trigger id="pl-status" class="h-9 w-full">
								{status === 'active' ? 'Active' : 'Draft'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="draft" label="Draft">Draft</Select.Item>
								<Select.Item value="active" label="Active">Active</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-starts" class="text-sm font-medium">Starts at (optional)</label>
						<Input id="pl-starts" type="datetime-local" bind:value={startsAt} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-ends" class="text-sm font-medium">Ends at (optional)</label>
						<Input id="pl-ends" type="datetime-local" bind:value={endsAt} class="h-9" />
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button onclick={submit} disabled={submitting}>
					{submitLabel}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
