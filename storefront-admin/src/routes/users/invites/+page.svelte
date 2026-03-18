<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PaginationTable,
		TableHead,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import InviteCreateSheet from '$lib/components/organs/invite/create/inviteCreate.svelte';
	import Mail from '@lucide/svelte/icons/mail';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { client } from '$lib/client.js';

	let { data }: { data: PageData } = $props();

	type Invite = {
		id: string;
		email: string;
		role?: string | null;
		accepted: boolean;
		expires_at: string | Date;
		created_at: string | Date;
	};
	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const paginateState = createPagination(
		async () => {
			return client.invites.get({ query: paginationQuery as any });
		},
		['invites']
	);

	const invites = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(
		pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	const invitesLoading = $derived(paginateState.loading);
	const invitesError = $derived(paginateState.error);

	let inviteOpen = $state(false);
	let resendError = $state<string | null>(null);
	let resendingId = $state<string | null>(null);

	const tableColumns: TableColumn[] = [
		{ label: 'Email', key: 'email', type: 'text' },
		{ label: 'Role', key: 'role', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Expires', key: 'expires_at', type: 'date' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Actions', key: 'actions', type: 'actions' }
	];

	let prevParams = $state<string | null>(null);
	$effect(() => {
		const params = page.url.searchParams.toString();
		if (prevParams !== null && prevParams !== params) {
			paginateState.refetch();
		}
		prevParams = params;
	});

	function formatDate(iso: string | Date) {
		if (iso instanceof Date) {
			return iso.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});
		}
		return iso;
	}

	function isExpired(expiresAt: string | Date) {
		if (expiresAt instanceof Date) {
			return expiresAt < new Date();
		}
		return new Date(expiresAt) < new Date();
	}

	function parseClientError(result: any, fallback: string) {
		const msg = result?.error?.value?.message;
		return typeof msg === 'string' && msg.trim().length > 0 ? msg : fallback;
	}

	async function resendInvite(invite: Invite) {
		if (invite.accepted) return;
		resendError = null;
		resendingId = invite.id;
		try {
			const res = await (client as any).invites({ id: invite.id }).resend.post();
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to resend invite'));
			}
			paginateState.refetch();
		} catch (e) {
			resendError = e instanceof Error ? e.message : String(e);
		} finally {
			resendingId = null;
		}
	}
</script>

<svelte:head>
    <title>Invites</title>
    <meta name="description" content="Manage invites." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Mail class="size-4" />
				<span class="font-semibold">Invites</span>
			</div>
			<Button size="sm" onclick={() => (inviteOpen = true)}>Invite user</Button>
		</div>
		<PaginationTable>
			{#if resendError}
				<div
					class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{resendError}
				</div>
			{/if}
			{#if invitesError}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{invitesError}
				</div>
			{:else if invitesLoading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else if invites.length === 0}
				<div
					class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground bg-card"
				>
					No invites yet. Click &quot;Invite user&quot; to send your first invite.
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<tbody>
							{#each invites as invite (invite.id)}
								<tr class="border-b last:border-0">
									<td class="px-4 py-3">{invite.email}</td>
									<td class="px-4 py-3">{invite.role ?? '—'}</td>
									<td class="px-4 py-3">
										{#if invite.accepted}
											<span
												class="inline-flex rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-green-500"
												>Accepted</span
											>
										{:else if isExpired(invite.expires_at)}
											<span
												class="inline-flex rounded-full bg-gray-500 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-gray-400"
												>Expired</span
											>
										{:else}
											<span
												class="inline-flex rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-amber-500"
												>Pending</span
											>
										{/if}
									</td>
									<td class="px-4 py-3">{formatDate(invite.expires_at)}</td>
									<td class="px-4 py-3">{formatDate(invite.created_at)}</td>
									<td class="px-4 py-3 text-right">
										{#if !invite.accepted}
											<Button
												size="sm"
												variant="outline"
												disabled={resendingId === invite.id}
												onclick={() => resendInvite(invite)}
											>
												{resendingId === invite.id ? 'Sending…' : 'Resend'}
											</Button>
										{:else}
											—
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if pagination && pagination.total_pages > 1}
					<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
				{/if}
			{/if}
		</PaginationTable>
	</div>
</div>
<InviteCreateSheet bind:open={inviteOpen} formData={data.inviteCreateForm} onSuccess={() => paginateState.refetch()} />
