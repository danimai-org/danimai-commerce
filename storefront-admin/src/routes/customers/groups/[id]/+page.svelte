<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { JSONComponent, MetadataComponent } from '$lib/components/organs/index.js';
	import {
		CustomerGroupBreadcrumb,
		CustomerGroupOverviewCard,
		CustomerGroupCustomersCard
	} from '$lib/components/organs/customer-group/detail/index.js';
	import { getCustomerGroup, type CustomerGroupDetail } from '$lib/customer-groups/api.js';

	const groupId = $derived(page.params?.id ?? '');

	let group = $state<CustomerGroupDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadGroup() {
		if (!groupId) return;
		loading = true;
		error = null;
		try {
			group = await getCustomerGroup(groupId);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			group = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadGroup();
	});

	function goToGroupsList() {
		goto(resolve('/customers/groups', {}), { replaceState: true });
	}
</script>

<svelte:head>
	<title>{group ? group.name : 'Customer group'} | Customer Groups | Danimai Store</title>
	<meta name="description" content="Manage customer group." />
</svelte:head>

<div class="flex h-full flex-col">
	<CustomerGroupBreadcrumb label={group?.name ?? ''} {loading} />

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !group}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Customer group not found'}</p>
			<Button variant="outline" onclick={goToGroupsList}>Back to Customer Groups</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<CustomerGroupOverviewCard {group} onGroupRefresh={loadGroup} />
				<CustomerGroupCustomersCard {groupId} onGroupRefresh={loadGroup} />
				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={group.id}
						metadataEntity="customer-group"
						entityName={group.name}
						metadata={(group.metadata ?? {}) as Record<string, unknown>}
						onSaved={loadGroup}
					/>
					<JSONComponent product={group} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
