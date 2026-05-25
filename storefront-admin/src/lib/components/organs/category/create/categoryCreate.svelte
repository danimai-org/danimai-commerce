<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast, Toaster } from 'svelte-sonner';
	import { client } from '$lib/client.js';
	import CategoryAttributePicker from '../CategoryAttributePicker.svelte';
	import { uniqueSelectedAttributeIds } from '../category-attribute-catalog.js';
	import Check from '@lucide/svelte/icons/check';
	import Info from '@lucide/svelte/icons/info';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	const HANDLE_REGEX = /^[a-z0-9-]*$/;

	let createStep = $state(1);
	let submitting = $state(false);
	let attributesControlKey = $state(0);

	let categoryNameError = $state<string | null>(null);
	let categoryHandleError = $state<string | null>(null);

	let selectedToAdd = $state<string[]>([]);
	let requiredByAttributeId = $state<Record<string, boolean>>({});

	const { form, reset } = superForm(page.data.categoryCreateForm, {
		resetForm: true
	});

	const pickerActive = $derived(open && createStep === 2);

	$effect(() => {
		if (open) return;
		createStep = 1;
		submitting = false;
		categoryNameError = null;
		categoryHandleError = null;
		selectedToAdd = [];
		requiredByAttributeId = {};
		reset();
	});

	function close() {
		if (!submitting) open = false;
	}

	function buildHandle(name: string, rawHandle: string): string {
		const trimmed = rawHandle.trim();
		return (trimmed || name)
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
	}

	function validateCategoryStep(): boolean {
		const name = ($form.name ?? '').trim();
		const handle = ($form.handle ?? '').trim();

		categoryNameError = null;
		categoryHandleError = null;

		let valid = true;
		if (name.length < 3) {
			categoryNameError = 'Name must be at least 3 characters';
			valid = false;
		} else if (name.length > 50) {
			categoryNameError = 'Name is too long';
			valid = false;
		}
		if (handle.length > 100) {
			categoryHandleError = 'Handle is too long';
			valid = false;
		} else if (handle && !HANDLE_REGEX.test(handle)) {
			categoryHandleError = 'Use lowercase letters, numbers, and hyphens only';
			valid = false;
		}
		return valid;
	}

	function validateAttributesStep(): boolean {
		if (uniqueSelectedAttributeIds(selectedToAdd).length === 0) {
			toast.error('Select at least one attribute');
			return false;
		}
		return true;
	}

	function goToStep2() {
		if (!validateCategoryStep()) return;
		attributesControlKey += 1;
		createStep = 2;
	}

	async function submitCreate() {
		if (!validateCategoryStep()) {
			createStep = 1;
			return;
		}
		if (!validateAttributesStep()) return;

		const name = ($form.name ?? '').trim();
		const handle = buildHandle(name, $form.handle ?? '');
		const nextIds = uniqueSelectedAttributeIds(selectedToAdd);

		submitting = true;
		try {
			const categoryRes = await client['product-categories'].post({
				value: name,
				metadata: { handle } as Record<string, string>
			});
			if (categoryRes.error) {
				toast.error('Failed to create category');
				return;
			}
			const categoryId = (categoryRes.data as { id?: string } | undefined)?.id;
			if (!categoryId) {
				toast.error('Failed to create category');
				return;
			}

			const updated = await client['product-categories']({ id: categoryId }).put({
				attributes: nextIds.map((attribute_id) => ({
					attribute_id,
					required: requiredByAttributeId[attribute_id] ?? false
				}))
			});
			if (
				updated == null ||
				(typeof updated === 'object' &&
					'error' in updated &&
					(updated as { error?: unknown }).error)
			) {
				toast.error('Category created, but could not attach attributes');
				return;
			}

			if (nextIds.length === 1) toast.success('Category and attribute created successfully');
			else toast.success(`Category created with ${nextIds.length} attributes`);
			open = false;
			onSuccess();
		} catch {
			toast.error('Something went wrong');
		} finally {
			submitting = false;
		}
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex h-full w-lg max-w-xl flex-col sm:max-w-2xl">
		<div class="flex h-full min-h-0 flex-col">
			<div class="shrink-0 border-b px-4 py-4 sm:px-6">
				<div class="-mx-1 overflow-x-auto px-1">
					<div class="flex min-w-max items-center gap-1">
						<button
							type="button"
							class={cn(
								'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
								createStep === 1
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:text-foreground'
							)}
							onclick={() => (createStep = 1)}
						>
							{#if createStep > 1}
								<Check class="size-4" />
							{:else}
								<Info class="size-4" />
							{/if}
							Details
						</button>
						<button
							type="button"
							class={cn(
								'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
								createStep === 2
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:text-foreground'
							)}
							onclick={goToStep2}
						>
							{#if createStep === 2}
								<Info class="size-4" />
							{/if}
							Attributes
						</button>
					</div>
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if createStep === 1}
					<h2 class="text-lg font-semibold">Create category</h2>
					<p class="mt-1 text-sm text-muted-foreground">Add a new category.</p>

					<div class="mt-6 flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="category-name" class="text-sm font-medium">Name</label>
							<Input
								id="category-name"
								name="name"
								bind:value={$form.name}
								placeholder="e.g. Category Name"
								aria-invalid={categoryNameError ? 'true' : undefined}
								class={cn(categoryNameError && 'border-destructive')}
							/>
							{#if categoryNameError}
								<span class="text-xs text-destructive">{categoryNameError}</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label for="category-handle" class="text-sm font-medium">Handle</label>
							<Input
								id="category-handle"
								name="handle"
								bind:value={$form.handle}
								placeholder="e.g. category-name"
								aria-invalid={categoryHandleError ? 'true' : undefined}
								class={cn(categoryHandleError && 'border-destructive')}
							/>
							{#if categoryHandleError}
								<span class="text-xs text-destructive">{categoryHandleError}</span>
							{/if}
							<p class="text-xs text-muted-foreground">
								Shown in URLs; use lowercase and hyphens. A leading "/" will be added when
								displayed.
							</p>
						</div>
					</div>
				{:else}
					<h2 class="text-lg font-semibold">Add attributes</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Select existing attributes from your catalog to attach to this category.
					</p>

					<div class="mt-6">
						<CategoryAttributePicker
							{open}
							active={pickerActive}
							comboboxId="create-category-attributes"
							controlKey={attributesControlKey}
							bind:selectedToAdd
							bind:requiredByAttributeId
							disabled={submitting}
						/>
					</div>
				{/if}
			</div>

			<div class="flex shrink-0 justify-end gap-2 border-t border-border p-4">
				<Button variant="outline" type="button" disabled={submitting} onclick={close}>Cancel</Button
				>
				{#if createStep === 1}
					<Button type="button" disabled={submitting} onclick={goToStep2}>Continue</Button>
				{:else}
					<Button
						type="button"
						variant="outline"
						disabled={submitting}
						onclick={() => (createStep = 1)}>Back</Button
					>
					<Button type="button" disabled={submitting} onclick={submitCreate}>
						{submitting ? 'Creating…' : 'Create'}
					</Button>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
