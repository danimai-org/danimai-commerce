<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		mode = 'edit',
		region = null as any | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'edit';
		region?: any | null;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{
			id: '',
			name: '',
			tax_provider_id: ''
		},
		{
			resetForm: false,
			onResult: ({ result }) => {
				if (result.status === 200) {
					open = false;
					onSuccess();
				}
			}
		}
	);

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
			name: String(region?.name ?? ''),
			tax_provider_id: String(region?.tax_provider_id ?? '')
		};
	});

	function close() {
		open = false;
	}

	const title = $derived('Edit Tax Region');
	const subtitle = $derived('Update the tax region details.');
	const submitLabel = $derived($delayed ? 'Saving...' : 'Save');
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="tr-name" class="text-sm font-medium">Name</label>
						<Input
							id="tr-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. India"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="tr-tax-provider" class="text-sm font-medium">Tax provider</label>
						<Input
							id="tr-tax-provider"
							name="tax_provider_id"
							bind:value={$form.tax_provider_id}
							placeholder="Tax provider ID (optional)"
							aria-invalid={$errors.tax_provider_id ? 'true' : undefined}
							class={cn('h-9', $errors.tax_provider_id && 'border-destructive')}
						/>
						{#if $errors.tax_provider_id}
							<span class="text-xs text-destructive">{$errors.tax_provider_id}</span>
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
