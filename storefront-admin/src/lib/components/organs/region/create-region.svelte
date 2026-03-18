<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';

	interface Props {
		open: boolean;
		formData: any;
		onSuccess?: () => void;
	}

	let {
		open = $bindable(false),
		formData: initialFormData,
		onSuccess = () => {}
	}: Props = $props();

	const { form, errors, enhance, delayed } = superForm(initialFormData, {
		resetForm: true,
		onResult: ({ result }) => {
		if (result.type === 'success') {
				open = false;
				onSuccess();
			}
		}
	});

let initialized = $state(false);

$effect(() => {
	if (!open) {
		initialized = false;
		return;
	}

	if (initialized) return;
	initialized = true;
	$form = {
		name: '',
		currency_code: ''
	};
	$errors = {};
});

	function close() {
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Region</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Manage tax rates and providers for a set of countries.
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-name" class="text-sm font-medium">Name</label>
						<Input
							id="create-name"
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
						<label for="create-currency" class="text-sm font-medium">Currency</label>
						<Input
							id="create-currency"
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
					{$delayed ? 'Creating...' : 'Create'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>