<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { MultiSelectCombobox } from '$lib/components/organs/multi-select-combobox/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Database from '@lucide/svelte/icons/database';
	import Code from '@lucide/svelte/icons/code';
	import List from '@lucide/svelte/icons/list';
	import Copy from '@lucide/svelte/icons/copy';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductAttributeGroupAttribute = {
		id: string;
		title: string;
		type: string;
	};

	type ProductAttribute = {
		id: string;
		title: string;
		type: string;
	};

	type PaginatedAttributesResponse = {
		data: ProductAttribute[];
		pagination: { total: number; page: number; limit: number };
	};

	type ProductAttributeGroup = {
		id: string;
		title: string;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
		attributes: ProductAttributeGroupAttribute[];
	};

	const groupId = $derived($page.params.id);

	let group = $state<ProductAttributeGroup | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let editOpen = $state(false);
	let editTitle = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);
	let allAttributes = $state<ProductAttribute[]>([]);
	let allAttributesLoading = $state(false);
	let editSelectedAttributeIds = $state<string[]>([]);

	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);

	async function loadGroup() {
		if (!groupId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups/${groupId}`, {
				cache: 'no-store'
			});
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Attribute group not found';
					group = null;
					return;
				}
				throw new Error(await res.text());
			}
			group = (await res.json()) as ProductAttributeGroup;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			group = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		groupId;
		loadGroup();
	});

	async function loadAllAttributes() {
		allAttributesLoading = true;
		try {
			const res = await fetch(`${API_BASE}/product-attributes?limit=100`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			const json = (await res.json()) as PaginatedAttributesResponse;
			allAttributes = json.data ?? [];
		} catch {
			allAttributes = [];
		} finally {
			allAttributesLoading = false;
		}
	}

	function openEdit() {
		if (!group) return;
		editOpen = true;
		editTitle = group.title;
		editError = null;
		editSelectedAttributeIds = (group.attributes ?? []).map((a) => a.id);
		loadAllAttributes();
	}

	function closeEdit() {
		editOpen = false;
		editError = null;
	}

	async function submitEdit() {
		if (!group) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups/${group.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: editTitle.trim(), attribute_ids: editSelectedAttributeIds })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEdit();
			loadGroup();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	function openDeleteConfirm() {
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) deleteConfirmOpen = false;
	}

	async function confirmDelete() {
		if (!group) return;
		deleteSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ attribute_group_ids: [group.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			goto('/products/attribute-groups');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	const metadataKeys = $derived(
		group?.metadata && typeof group.metadata === 'object'
			? Object.keys(group.metadata as object).length
			: 0
	);

	const metadataEntries = $derived(
		group?.metadata && typeof group.metadata === 'object' && !Array.isArray(group.metadata)
			? Object.entries(group.metadata as Record<string, unknown>)
			: []
	);

	const groupJson = $derived(group ? JSON.stringify(group, null, 2) : '');
	const jsonKeys = $derived(group ? Object.keys(group).length : 0);

	let metadataSheetOpen = $state(false);
	let jsonSheetOpen = $state(false);

	async function copyJson() {
		if (!groupJson) return;
		try {
			await navigator.clipboard.writeText(groupJson);
		} catch {}
	}
</script>

<svelte:head>
	<title>{group ? group.title : 'Attribute Group'} | Attribute Groups | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] text-sm pl-[10px]">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/attribute-groups')}
			>
				<ListFilter class="size-4 shrink-0" />
				<span>Attribute Groups</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{group?.title ?? groupId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !group}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Attribute group not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/attribute-groups')}>
				Back to Attribute Groups
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="rounded-lg border bg-card p-6 shadow-sm">
					<section class="flex flex-col gap-6">
						<div class="flex items-center justify-between gap-4">
							<h1 class="text-2xl font-semibold tracking-tight">{group.title}</h1>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Edit"
											class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openEdit}
										>
											<Pencil class="size-4" />
											Edit
										</DropdownMenu.Item>
										<DropdownMenu.Item
											textValue="Delete"
											class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openDeleteConfirm}
										>
											<Trash2 class="size-4" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<dl class="grid gap-3 text-sm sm:grid-cols-2">
							<div>
								<dt class="text-muted-foreground">Created</dt>
								<dd>
									{new Date(group.created_at).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</dd>
							</div>
							<div>
								<dt class="text-muted-foreground">Updated</dt>
								<dd>
									{new Date(group.updated_at).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</dd>
							</div>
						</dl>
					</section>
				</div>

				<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<button
						type="button"
						class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card px-5 py-4 text-left shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onclick={() => (metadataSheetOpen = true)}
						aria-label="View metadata"
					>
						<span class="font-semibold text-foreground">Metadata</span>
						<span class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
							{metadataKeys} key{metadataKeys === 1 ? '' : 's'}
						</span>
						<ExternalLink class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					</button>

					<button
						type="button"
						class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card px-5 py-4 text-left shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onclick={() => (jsonSheetOpen = true)}
						aria-label="View JSON"
					>
						<span class="font-semibold text-foreground">JSON</span>
						<span class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
							{jsonKeys} key{jsonKeys === 1 ? '' : 's'}
						</span>
						<ExternalLink class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					</button>
				</div>

				<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
					<div class="flex flex-wrap items-start justify-between gap-2 border-b bg-card px-6 py-4">
						<div class="min-w-0 flex-1">
							<h2 class="flex items-center gap-2 text-base font-semibold">
								<List class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								Attributes
							</h2>
							<p class="mt-0.5 text-sm text-muted-foreground">
								Attributes assigned to this group. Assign this group to a product to show these attributes.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							class="shrink-0 gap-1.5"
							onclick={openEdit}
							aria-label="Edit attributes"
						>
							<Pencil class="size-4 shrink-0" />
							Edit
						</Button>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-b bg-muted/50">
								<tr>
									<th class="px-4 py-3 text-left font-medium">Title</th>
									<th class="px-4 py-3 text-left font-medium">Type</th>
								</tr>
							</thead>
							<tbody>
								{#if (group.attributes ?? []).length === 0}
									<tr>
										<td colspan="2" class="px-4 py-8 text-center text-muted-foreground">
											No attributes in this group.
										</td>
									</tr>
								{:else}
									{#each (group.attributes ?? []) as attr (attr.id)}
										<tr class="border-b last:border-0">
											<td class="px-4 py-3 font-medium">{attr.title}</td>
											<td class="px-4 py-3 text-muted-foreground capitalize">{attr.type}</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</div>
	{/if}
</div>

<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute group title.</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							bind:value={editTitle}
							placeholder="e.g. Specifications"
							class={cn('h-9', editError === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="rounded-lg border bg-card p-4 shadow-sm">
						<div class="flex items-center gap-2 mb-2">
							<List class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							<h3 class="text-sm font-semibold">Attributes</h3>
						</div>
						<p class="mb-3 text-xs text-muted-foreground">
							Assign attributes to this group. They will be shown when this group is used on a product.
						</p>
						{#if allAttributesLoading}
							<p class="py-3 text-sm text-muted-foreground">Loading attributes…</p>
						{:else}
							<MultiSelectCombobox
								id="edit-attributes"
								options={allAttributes.map((a) => ({ id: a.id, value: a.title }))}
								bind:value={editSelectedAttributeIds}
								placeholder="Type to add…"
								emptyMessage="No attributes available."
								class="mt-1"
							/>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<Sheet.Root bind:open={metadataSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="flex items-center gap-2 text-lg font-semibold">
					<Database class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					Metadata
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">Custom key-value data for this attribute group.</p>
				<div class="mt-6">
					{#if metadataEntries.length === 0}
						<p class="rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
							No metadata.
						</p>
					{:else}
						<dl class="flex flex-col gap-2">
							{#each metadataEntries as [key, value]}
								<div class="flex flex-wrap items-baseline gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
									<dt class="font-medium text-foreground">{key}</dt>
									<dd class="text-muted-foreground">
										{typeof value === 'object' ? JSON.stringify(value) : String(value)}
									</dd>
								</div>
							{/each}
						</dl>
					{/if}
				</div>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<Sheet.Root bind:open={jsonSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex flex-1 flex-col overflow-hidden">
				<div class="flex shrink-0 items-center justify-between gap-2 border-b px-6 py-4">
					<h2 class="flex items-center gap-2 text-lg font-semibold">
						<Code class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
						JSON
					</h2>
					<Button
						variant="outline"
						size="sm"
						class="shrink-0 gap-1.5"
						onclick={copyJson}
						aria-label="Copy JSON"
					>
						<Copy class="size-4 shrink-0" />
						Copy
					</Button>
				</div>
				<div class="flex-1 overflow-auto p-6">
					<pre class="rounded-md border bg-muted/30 p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all min-w-0">{groupJson}</pre>
				</div>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="attribute group"
	entityTitle={group?.title ?? group?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
