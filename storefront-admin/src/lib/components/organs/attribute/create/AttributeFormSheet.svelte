<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Combobox } from '$lib/components/organs/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast, Toaster } from 'svelte-sonner';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	const DEBOUNCE_MS = 300;

	let liveTypeSearch = $state('');
	let debouncedTypeSearch = $state('');

	const { form, errors, enhance, delayed } = superForm(
		{ title: '', type: 'string' },
		{
			resetForm: true,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Attribute has been created successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	$effect(() => {
		if (!open) return;
		liveTypeSearch = '';
		debouncedTypeSearch = '';
	});

	$effect(() => {
		const s = liveTypeSearch;
		const tid = setTimeout(() => {
			debouncedTypeSearch = s.trim();
		}, DEBOUNCE_MS);
		return () => clearTimeout(tid);
	});

	const typesQuery = createQuery(() => ({
		queryKey: ['product-attribute-types', debouncedTypeSearch],
		queryFn: async () => {
			const res = await client['product-attributes'].types.get({
				query: debouncedTypeSearch ? { search: debouncedTypeSearch } : {}
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err.value?.message ?? 'Failed to load attribute types');
			}
			const body = res.data as { types?: string[] } | undefined;
			return body?.types ?? [];
		},
		enabled: () => open,
		refetchOnWindowFocus: false
	}));

	const typeOptions = $derived((typesQuery.data ?? []).map((t) => ({ id: t, value: t })));

	function close() {
		if (!$delayed) open = false;
	}

	const sheetTitle = $derived('Create attribute');
	const subtitle = $derived('Add a new attribute.');
	const typesLoading = $derived(typesQuery.isPending || typesQuery.isFetching);
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md">
		<form method="POST" action="?/create" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="type" bind:value={$form.type} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="attribute-title" class="text-sm font-medium">Title</label>
						<Input
							id="attribute-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Color, Size"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="attribute-type" class="text-sm font-medium">Type</label>
						<Combobox
							id="attribute-type"
							options={typeOptions}
							bind:value={$form.type}
							placeholder="Select type"
							disabled={$delayed}
							loading={typesLoading}
							onSearchChange={(q) => {
								liveTypeSearch = q;
							}}
							filterFn={(opts) => opts}
							emptyMessage="No matching type"
							class={cn($errors.type && 'border-destructive focus-within:ring-destructive/30')}
						/>
						{#if $errors.type}
							<span class="text-xs text-destructive">{$errors.type}</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Creating...' : 'Create'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
