<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Share2 from '@lucide/svelte/icons/share-2';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { DeleteConfirmationModal, JSONComponent, MetadataComponent, } from '$lib/components/organs/index.js';
	
	import EditSaleChannel from '$lib/components/organs/sales-channel/update/EditSaleChannel.svelte';

	const channelId = $derived(page.params?.id ?? '');

	let channel = $state<any | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let formSheetOpen = $state(false);
	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);

	const channelHandle = $derived.by(() => {
		const source = channel?.name?.trim() ?? '';
		if (!source) return `/${channel?.id ?? ''}`;
		return `/${source
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')}`;
	});

	async function loadChannel() {
		if (!channelId) return;
		loading = true;
		error = null;
		try {
			const res = await client['sales-channels']({ id: channelId }).get();
			if (res.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					error = 'Sales channel not found';
					channel = null;
					return;
				}
				error = err?.value?.message ?? String(res.error);
				channel = null;
				return;
			}
			channel = (res.data ?? null) as any | null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			channel = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		channelId;
		loadChannel();
	});

	function openEdit() {
		formSheetOpen = true;
	}

	function openDelete() {
		deleteError = null;
		deleteConfirmOpen = true;
	}

	async function confirmDelete() {
		if (!channel) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			await client['sales-channels'].delete({ sales_channel_ids: [channel.id] });
			deleteConfirmOpen = false;
			goto('/sales-channels');
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{channel?.name ?? channelId ?? 'Sales Channel'} | Sales Channels | Danimai Store</title>
	<meta name="description" content="Manage sales channel details." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/sales-channels')}
			>
				<Share2 class="size-4 shrink-0" />
				<span>Sales Channels</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{channel?.name ?? channelId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !channel}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Sales channel not found'}</p>
			<Button variant="outline" onclick={() => goto('/sales-channels')}>Back to Sales Channels</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-6 p-6">
				<div class="rounded-lg border bg-card p-8 shadow-sm">
					<div class="flex items-start justify-between gap-4">
						<div class="space-y-6">
							<h1 class="text-3xl font-semibold tracking-tight">{channel.name}</h1>
							<div class="grid gap-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
								<span class="pt-1 font-medium text-muted-foreground">Handle</span>
								<div class="rounded-md border bg-muted/20 px-3 py-1.5 font-mono text-foreground">
									{channelHandle}
								</div>
								<span class="pt-0.5 font-medium text-muted-foreground">Description</span>
								{#if channel.description}
									<p class="text-foreground">{channel.description}</p>
								{:else}
									<p class="text-muted-foreground">No description</p>
								{/if}
							</div>
						</div>
						<div class="flex flex-col items-end gap-3">
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={openEdit}
								aria-label="Edit sales channel"
							>
								<Pencil class="size-4" />
							</Button>
							<span
								class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${channel.is_default ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
							>
								{channel.is_default ? 'Default' : 'Not default'}
							</span>
						</div>
					</div>
				</div>

				<div class="rounded-lg border bg-card p-0 shadow-sm">
					<div class="flex items-center justify-between gap-4 border-b p-4">
						<h2 class="font-semibold">Products</h2>
						<div class="flex items-center gap-2">
							<Button size="sm">Add</Button>
							<Button size="sm" variant="outline">
								<SlidersHorizontal class="mr-2 size-4" />
								Sort
							</Button>
							<div class="relative">
								<Search class="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input class="h-9 w-56 pl-8" placeholder="Search" />
							</div>
							<Button size="icon" variant="outline" class="size-9">
								<SlidersHorizontal class="size-4" />
							</Button>
						</div>
					</div>
					<div class="overflow-auto p-4">
						<table class="w-full text-sm">
							<thead class="border-b bg-muted/20 text-left">
								<tr>
									<th class="px-4 py-3 font-medium">Product</th>
									<th class="px-4 py-3 font-medium">Collection</th>
									<th class="px-4 py-3 font-medium">Sales Channels</th>
									<th class="px-4 py-3 font-medium">Variants</th>
									<th class="px-4 py-3 font-medium">Status</th>
									<th class="px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td colspan={6} class="px-4 py-8 text-center text-muted-foreground">
										No products in this sales channel.
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={channel.id}
						metadata={(channel.metadata ?? {}) as Record<string, unknown>}
						onSaved={loadChannel}
					/>
					<JSONComponent product={channel} options={[]} variants={[]} category={null} />
				</div>

			</div>
		</div>
	{/if}
</div>

<EditSaleChannel
	bind:open={formSheetOpen}
	mode="edit"
	{channel}
	onSuccess={loadChannel}
/>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="sales channel"
	entityTitle={channel?.name ?? channel?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={() => {
		deleteConfirmOpen = false;
	}}
	submitting={deleteSubmitting}
	error={deleteError}
/>
