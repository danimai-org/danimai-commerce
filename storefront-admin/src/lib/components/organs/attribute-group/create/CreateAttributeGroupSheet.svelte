

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { client } from '$lib/client.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { SvelteSet } from 'svelte/reactivity';
	import { toast, Toaster } from 'svelte-sonner';
	import { MultiSelectCombobox } from '../../multi-select-combobox';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import {
		TableHead,
		TableBody,
		type TableColumn
	} from '$lib/components/organs/index.js';

	

	let {
		open = $bindable(false),
	
		onSuccess = () => {}
	}: {
		open?: boolean;
		
		onSuccess?: () => void;
	} = $props();

	function close() {
		if (!$delayed) open = false;
	}
	const { form, errors, enhance, delayed } = superForm(
		{ title: '', type: 'string', attribute_ids: [], required: false, rank: 0 },
		{
			resetForm: true,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Attribute group has been created successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	const sheetTitle = $derived('Create attribute group');
	const subtitle = $derived('Add a new attribute group.');
	const submitLabel = $derived($delayed ? 'Creating...' : 'Create');

	let attributeOptions = $state<{ id: string; value: string }[]>([]);
	let allAttributes = $state<{ id: string; title: string; type: string }[]>([]);
	let attributesLoading = $state(false);
	let attributesRequested = $state(false);

	const selectedAttributeIds = $derived($form.attribute_ids);

	const filteredAttributes = $derived.by(() => {
		const byId = new Map(allAttributes.map((a) => [a.id, a]));
		const seen = new SvelteSet<string>();
		const out: { id: string; title: string; type: string }[] = [];
		for (const id of selectedAttributeIds) {
			if (seen.has(id)) continue;
			seen.add(id);
			const row = byId.get(id);
			if (row) out.push(row);
		}
		return out;
	});

	type AttributeRow = (typeof allAttributes)[number];

	const tableColumns: TableColumn<AttributeRow>[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'text'
		},
		{ label: 'Type', key: 'type', type: 'text' }
	];

	async function fetchAvailableAttributes() {
		const res = await client['product-attributes'].get({
			query: {
				search: '',
				page: 1,
				limit: 100,
				sorting_field: 'created_at',
				
			}
		});
		return res.data?.rows ?? [];
	}

	async function ensureAvailableAttributes() {
		if (attributesLoading || attributesRequested) return;
		attributesLoading = true;
		try {
			const attributes = await fetchAvailableAttributes();
			attributeOptions = attributes.map((a) => ({ id: a.id, value: a.title }));
			allAttributes = attributes.map((a) => ({
				id: a.id,
				title: typeof a.title === 'string' ? a.title : String(a.title ?? ''),
				type: typeof a.type === 'string' ? a.type : a.type != null ? String(a.type) : ''
			}));
			attributesRequested = true;
		} catch {
			attributeOptions = [];
			allAttributes = [];
		} finally {
			attributesLoading = false;
		}
	}

	$effect(() => {
		if (!open) {
			attributeOptions = [];
			allAttributes = [];
			attributesRequested = false;
			attributesLoading = false;
		}
	});
</script>
<Toaster richColors position="top-center" />	
<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/create" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="type" value={$form.type} />
			<input type="hidden" name="required" value={$form.required ? 'true' : 'false'} />
			<input type="hidden" name="rank" value={String($form.rank)} />
			{#each $form.attribute_ids as attributeId (attributeId)}
				<input type="hidden" name="attribute_ids" value={attributeId} />
			{/each}
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="attribute-group-title" class="text-sm font-medium">Title</label>
						<Input
							id="attribute-group-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Specifications"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="attribute-group-attributes" class="text-sm font-medium">Attributes</label>
						<MultiSelectCombobox
							options={attributeOptions}
							bind:value={$form.attribute_ids}
							onOpen={ensureAvailableAttributes}
							loading={attributesLoading}
							showSelectedTable={false}
							placeholder="Type to add…"
							emptyMessage="No attributes available."
							class="mt-1" />
					</div>

					<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
						<div class="border-b bg-muted/40 px-4 py-3">
							<h3 class="flex items-center gap-2 text-sm font-semibold">
								<SlidersHorizontal class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								Selected attributes
							</h3>
						</div>
						<div class="p-3 sm:p-4">
							{#if filteredAttributes.length === 0}
								<div
									class="flex min-h-[8rem] items-center justify-center rounded-lg border border-dashed bg-muted/20 px-3 py-6"
								>
									<p class="text-center text-sm text-muted-foreground">
										No attribute selected yet.
									</p>
								</div>
							{:else}
								<div class="max-h-[14rem] min-h-0 overflow-auto rounded-lg border bg-card">
									<table class="w-full text-sm">
										<TableHead columns={tableColumns} />
										<TableBody
											rows={filteredAttributes}
											columns={tableColumns as TableColumn[]}
											emptyMessage="No attributes found."
										/>
									</table>
								</div>
							{/if}
						</div>
					</section>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{submitLabel}
				</Button>
			</div>
		</form>
	</Sheet.Content>
	</Sheet.Root>
	
