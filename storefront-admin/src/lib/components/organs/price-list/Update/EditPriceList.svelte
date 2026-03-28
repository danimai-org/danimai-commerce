<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { Toaster, toast } from 'svelte-sonner';
	import { cn } from '$lib/utils.js';
	type UpdateFormData = {
		id: string;
		name: string;
		description: string;
		type: 'sale' | 'override';
		status: 'active' | 'draft';
		starts_at: string;
		ends_at: string;
	};

	type PriceListRow = {
		id: string;
		name: string;
		description: string | null;
		type: 'sale' | 'override';
		status: 'active' | 'draft';
		starts_at: string | null;
		ends_at: string | null;
	};

	let {
		open = $bindable(false),
		priceListUpdateForm,
		list = null as PriceListRow | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		priceListUpdateForm: SuperValidated<UpdateFormData>;
		list?: PriceListRow | null;
		onSuccess?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, delayed } = superForm(priceListUpdateForm, {
		resetForm: false,
		onResult: ({ result }) => {
			if (result.status === 200) {
				open = false;
				toast.success('Price list has been updated successfully');
				onSuccess();
			}
		}
	});

	$effect(() => {
		if (open && list) {
			$form = {
				id: list.id,
				name: list.name,
				description: list.description ?? '',
				type: list.type,
				status: list.status,
				starts_at: list.starts_at ? list.starts_at.slice(0, 16) : '',
				ends_at: list.ends_at ? list.ends_at.slice(0, 16) : ''
			};
		}
	});
	function close() {
		open = false;
	}
	const title = $derived('Edit price list');
	const subtitle = $derived('Update name, type, status, and dates.');
	const submitLabel = $derived($delayed ? 'Saving…' : 'Save');
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="pl-edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="pl-edit-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. Summer Sale 2026"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-edit-description" class="text-sm font-medium"
							>Description (optional)</label
						>
						<Input
							id="pl-edit-description"
							name="description"
							bind:value={$form.description}
							placeholder="Short description"
							aria-invalid={$errors.description ? 'true' : undefined}
							class={cn('h-9', $errors.description && 'border-destructive')}
						/>
						{#if $errors.description}
							<span class="text-xs text-destructive">{$errors.description}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-edit-type" class="text-sm font-medium">Type</label>
						<input type="hidden" name="type" value={$form.type} />
						<Select.Root
							type="single"
							value={$form.type}
							onValueChange={(v) => v && ($form.type = v as 'sale' | 'override')}
						>
							<Select.Trigger id="pl-edit-type" class="h-9 w-full">
								{$form.type === 'sale' ? 'Sale' : 'Override'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="sale" label="Sale">Sale</Select.Item>
								<Select.Item value="override" label="Override">Override</Select.Item>
							</Select.Content>
						</Select.Root>
						{#if $errors.type}
							<span class="text-xs text-destructive">{$errors.type}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-edit-status" class="text-sm font-medium">Status</label>
						<input type="hidden" name="status" value={$form.status} />
						<Select.Root
							type="single"
							value={$form.status}
							onValueChange={(v) => v && ($form.status = v as 'active' | 'draft')}
						>
							<Select.Trigger id="pl-edit-status" class="h-9 w-full">
								{$form.status === 'active' ? 'Active' : 'Draft'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="draft" label="Draft">Draft</Select.Item>
								<Select.Item value="active" label="Active">Active</Select.Item>
							</Select.Content>
						</Select.Root>
						{#if $errors.status}
							<span class="text-xs text-destructive">{$errors.status}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-edit-starts" class="text-sm font-medium">Starts at (optional)</label>
						<Input
							id="pl-edit-starts"
							name="starts_at"
							type="datetime-local"
							bind:value={$form.starts_at}
							class="h-9"
						/>
						{#if $errors.starts_at}
							<span class="text-xs text-destructive">{$errors.starts_at}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="pl-edit-ends" class="text-sm font-medium">Ends at (optional)</label>
						<Input
							id="pl-edit-ends"
							name="ends_at"
							type="datetime-local"
							bind:value={$form.ends_at}
							class="h-9"
						/>
						{#if $errors.ends_at}
							<span class="text-xs text-destructive">{$errors.ends_at}</span>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{submitLabel}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
