<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Combobox, type ComboboxOption } from '$lib/components/organs/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { Toaster, toast } from 'svelte-sonner';
	import type { Attribute } from '../type.js';

	type AttributeForEdit = NonNullable<Attribute>;

	let {
		open = $bindable(false),
		attribute = null as AttributeForEdit | null,
		onSuccess = () => {},
		onClosed = () => {}
	}: {
		open?: boolean;
		attribute?: AttributeForEdit | null;
		onSuccess?: () => void | Promise<void>;
		onClosed?: () => void;
	} = $props();

	let initializedForId = $state<string | null>(null);

	let typeOptionsRemote = $state<ComboboxOption[]>([]);
	let typesLoading = $state(false);
	let typeDebounceTimer: ReturnType<typeof setTimeout> | undefined;
	let typeSearchRequestId = 0;

	const ATTRIBUTE_TYPES = ['string', 'number', 'boolean', 'date'] as const;

	const { form, errors, enhance, message, delayed, reset } = superForm(
		{
			id: '',
			title: '',
			type: ''
		},
		{
			resetForm: false,
			onResult: async ({ result }) => {
				if (result.status === 200) {
					toast.success('Attribute updated successfully');
					open = false;
					if (onSuccess) await onSuccess();
				}
			}
		}
	);

	const typeOptions = $derived.by((): ComboboxOption[] => {
		const map = new SvelteMap<string, ComboboxOption>();
		for (const t of ATTRIBUTE_TYPES) map.set(t, { id: t, value: t });
		for (const o of typeOptionsRemote) map.set(o.id, o);
		const c = String($form.type ?? '').trim();
		if (c && !map.has(c)) map.set(c, { id: c, value: c });
		return Array.from(map.values());
	});

	async function fetchDistinctTypes(search: string): Promise<ComboboxOption[]> {
		const res = await client['product-attributes'].get({
			query: {
				search: search.trim(),
				page: 1,
				limit: 100,
				sorting_field: 'created_at'
			}
		});
		const rows = (res.data?.rows ?? []) as { type?: unknown }[];
		const seen = new SvelteSet<string>();
		const out: ComboboxOption[] = [];
		for (const r of rows) {
			const t = typeof r.type === 'string' ? r.type : r.type != null ? String(r.type) : '';
			const norm = t.trim();
			if (norm && !seen.has(norm)) {
				seen.add(norm);
				out.push({ id: norm, value: norm });
			}
		}
		return out;
	}

	async function runTypeSearch(query: string) {
		const id = ++typeSearchRequestId;
		typesLoading = true;
		try {
			const remote = await fetchDistinctTypes(query);
			if (id !== typeSearchRequestId) return;
			typeOptionsRemote = remote;
		} catch {
			if (id !== typeSearchRequestId) return;
			typeOptionsRemote = [];
		} finally {
			if (id === typeSearchRequestId) typesLoading = false;
		}
	}

	function scheduleTypeSearch(query: string) {
		if (typeDebounceTimer) clearTimeout(typeDebounceTimer);
		typeDebounceTimer = setTimeout(() => {
			typeDebounceTimer = undefined;
			void runTypeSearch(query);
		}, 300);
	}

	$effect(() => {
		if (!open) {
			initializedForId = null;
			typeOptionsRemote = [];
			typesLoading = false;
			if (typeDebounceTimer) {
				clearTimeout(typeDebounceTimer);
				typeDebounceTimer = undefined;
			}
			typeSearchRequestId++;
			return;
		}

		const nextId = attribute?.id ?? '';
		if (!nextId) return;
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		reset({
			data: {
				id: attribute!.id,
				title: attribute!.title ?? '',
				type: attribute!.type ?? ''
			}
		});
		void runTypeSearch('');
	});

	function close() {
		open = false;
	}

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClosed();
			message.set('');
		}
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open {onOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<input type="hidden" name="type" bind:value={$form.type} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute details.</p>
				{#if $message}
					<p class="mt-4 text-sm text-destructive">{$message}</p>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Color"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn('h-9', $errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-type" class="text-sm font-medium">Type</label>
						<Combobox
							id="edit-type"
							options={typeOptions}
							bind:value={$form.type}
							placeholder="Type to search…"
							disabled={$delayed}
							loading={typesLoading}
							onSearchChange={scheduleTypeSearch}
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
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
