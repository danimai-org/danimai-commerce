

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { client } from '$lib/client.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast, Toaster } from 'svelte-sonner';
	import { MultiSelectCombobox } from '../../multi-select-combobox';
	type AttributeItem = { id: string; title: string; type: string };
	type Mode = 'create';

	let {
		open = $bindable(false),
		mode = 'create',
		attribute = null as AttributeItem | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: Mode;
		attribute?: AttributeItem | null;
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
	let attributesLoading = $state(false);
	let attributesRequested = $state(false);

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
			attributesRequested = true;
		} catch {
			attributeOptions = [];
		} finally {
			attributesLoading = false;
		}
	}

	$effect(() => {
		if (!open) {
			attributeOptions = [];
			attributesRequested = false;
			attributesLoading = false;
		}
	});
</script>
<Toaster richColors position="top-center" />	
<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/create" use:enhance class="flex h-full flex-col">
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
							placeholder="Type to add…"
							emptyMessage="No attributes available."
							class="mt-1" />
					</div>
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
	
