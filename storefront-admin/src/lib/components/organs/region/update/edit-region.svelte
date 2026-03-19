<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';

	type Region = {
		id: string;
		name: string;
		currency_code: string;
	};

	interface Props {
		open: boolean;
		region: Region | null;
		formData: any;
		onSuccess?: () => void;
	}

	let {
		open = $bindable(false),
		region = null,
		formData: initialFormData,
		onSuccess = () => {}
	}: Props = $props();

	const { form, errors, enhance, delayed } = superForm(initialFormData, {
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				open = false;
				onSuccess();
			}
		}
	});

	let initializedForId = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			return;
		}

		const nextId = region?.id ?? '';
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			name: region?.name ?? '',
			currency_code: region?.currency_code ?? ''
		};
	$errors = {};
	});

	function close() {
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the region details.
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. South Asia"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-currency" class="text-sm font-medium">Currency</label>
						<Input
							id="edit-currency"
							name="currency_code"
							bind:value={$form.currency_code}
							placeholder="e.g. INR"
							aria-invalid={$errors.currency_code ? 'true' : undefined}
							class={cn('h-9', $errors.currency_code && 'border-destructive')}
						/>
						{#if $errors.currency_code}
							<span class="text-xs text-destructive">{$errors.currency_code}</span>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>