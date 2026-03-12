<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { createAttribute, updateAttribute } from '$lib/product-attributes/api.js';

	type AttributeFormMode = 'create' | 'edit';

	interface Props {
		open?: boolean;
		mode?: AttributeFormMode;
		item?: { id?: string; title?: string; type?: string } | null;
		onSaved?: () => void | Promise<void>;
		onCancel?: () => void | Promise<void>;
	}

	let {
		open = $bindable(false),
		mode = 'create',
		item = null,
		onSaved = () => {},
		onCancel = () => {}
	}: Props = $props();

	const ATTRIBUTE_TYPES = [
		{ value: 'string', label: 'String' },
		{ value: 'number', label: 'Number' },
		{ value: 'boolean', label: 'Boolean' },
		{ value: 'date', label: 'Date' }
	] as const;

	let formTitle = $state('');
	let formType = $state('string');
	let formError = $state<string | null>(null);
	let formSubmitting = $state(false);

	$effect(() => {
		if (!open) return;
		if (mode === 'edit' && item) {
			formTitle = item.title ?? '';
			formType = item.type ?? 'string';
		} else {
			formTitle = '';
			formType = 'string';
		}
		formError = null;
	});

	async function handleSubmit() {
		formError = null;
		if (!formTitle.trim()) {
			formError = 'Title is required';
			return;
		}
		formSubmitting = true;
		try {
			if (mode === 'create') {
				await createAttribute({ title: formTitle.trim(), type: formType });
			} else {
				if (!item?.id) {
					formError = 'Attribute id is missing';
					return;
				}
				await updateAttribute(item.id, { title: formTitle.trim(), type: formType });
			}
			open = false;
			await onSaved();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formSubmitting = false;
		}
	}

	async function handleCancel() {
		if (formSubmitting) return;
		open = false;
		formError = null;
		await onCancel();
	}
</script>

<Sheet.Root bind:open={open}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{mode === 'create' ? 'Create' : 'Edit'} Attribute</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{mode === 'create'
						? 'Add a new product attribute (e.g. Color, Size).'
						: 'Update the attribute title and type.'}
				</p>
				{#if formError && !formSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{formError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="form-title" class="text-sm font-medium">Title</label>
						<Input
							id="form-title"
							bind:value={formTitle}
							placeholder="e.g. Color, Size"
							class={cn('h-9', formError === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="form-type" class="text-sm font-medium">Type</label>
						<select
							id="form-type"
							bind:value={formType}
							class="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs ring-offset-background outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if formType && !ATTRIBUTE_TYPES.some((t) => t.value === formType)}
								<option value={formType}>{formType}</option>
							{/if}
							{#each ATTRIBUTE_TYPES as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={handleCancel}>Cancel</Button>
				<Button onclick={handleSubmit} disabled={formSubmitting}>
					{formSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
