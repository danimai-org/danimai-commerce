

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {client} from '$lib/client.js';
	import { cn } from '$lib/utils.js';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters'; 
	import { z } from 'zod';
	import { toast, Toaster } from 'svelte-sonner';
	import { MultiSelectCombobox } from '../../multi-select-combobox';


	const AttributeGroupCreateSchema = z.object({
			title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
			type: z.enum(['string', 'number', 'boolean', 'date']),
			attribute_ids: z.array(z.string()).default([]),
	});

	type AttributeGroupFormData = z.infer<typeof AttributeGroupCreateSchema>;
	type AttributeItem = { id: string; title: string; type: string };
	type Mode = 'create' ;

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

	let error = $state<string | null>(null);

	$effect(() => {
		if (open) {
			error = null;
		}
	});

	function close() {
		if (!$delayed) open = false;
	}
	const { form, errors, enhance, delayed, message, reset } = superForm(
		defaults({ title: '', type: 'string', attribute_ids: [] }, zod4(AttributeGroupCreateSchema)),
		{
			SPA: true,
			validators: zod4(AttributeGroupCreateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					await client['product-attribute-groups'].post({
						title: form.data.title.trim(),
						attributes: form.data.attribute_ids.map((attribute_id) => ({ attribute_id }))
					});
					toast.success('Attribute group has been created successfully');
					open = false;
					onSuccess();
				} catch (e: any) {
					const errorMsg = e?.message || 'An unexpected error occurred';
					toast.error(errorMsg);
					error = errorMsg;
				}
			},
		}
	);		
	$effect(() => {
		if (open) {
			reset({ 
				data: { title: '', type: 'string' as const, attribute_ids: [] } 
			});
		}
	});	
	const sheetTitle = $derived('Create attribute group');
	const subtitle = $derived(
		'Add a new attribute group.'
	);
	const submitLabel = $derived(
		$delayed ? 'Creating…' : 'Create'
	);

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
		<form method="POST" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				{#if error ?? $message}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error ?? $message}
					</div>
				{/if}
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
	
