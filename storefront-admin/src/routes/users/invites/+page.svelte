<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		MultiSelectCombobox,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Mail from '@lucide/svelte/icons/mail';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const API_BASE = 'http://localhost:8000/admin';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	type Role = {
		id: string;
		name: string;
		description: string;
		
	};

	type Invite = {
		id: string;
		email: string;
		role: string | null;
		accepted: boolean;
		expires_at: string;
		created_at: string;
		updated_at: string;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	let inviteOpen = $state(false);
	let inviteEmail = $state('');
	let inviteRoleIds = $state<string[]>([]);
	let roles = $state<Role[]>([]);
	let inviteLoading = $state(false);
	let inviteSubmitting = $state(false);
	let inviteError = $state<string | null>(null);
	let inviteSuccess = $state(false);

	let searchQuery = $state('');
	let invitesData = $state<{ rows: Invite[]; pagination: Pagination } | null>(null);
	let invitesLoading = $state(true);
	let invitesError = $state<string | null>(null);
	const limit = 10;
	let resendingId = $state<string | null>(null);

	const tableColumns: TableColumn[] = [
		{ label: 'Email', key: 'email', type: 'text' },
		{ label: 'Role', key: 'role', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Expires', key: 'expires_at', type: 'date' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Actions', key: 'actions', type: 'actions' }
	];

	async function fetchInvites() {
		invitesLoading = true;
		invitesError = null;
		try {
			const params = new URLSearchParams({
				page: String(paginationQuery.page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/invites?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			invitesData = (await res.json()) as { rows: Invite[]; pagination: Pagination };
		} catch (e) {
			invitesError = e instanceof Error ? e.message : String(e);
			invitesData = null;
		} finally {
			invitesLoading = false;
		}
	}

	$effect(() => {
		page;
		fetchInvites();
	});

	const invites = $derived(invitesData?.rows ?? []);
	const pagination = $derived(invitesData?.pagination ?? null);
	const start = $derived(
		pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

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

	async function openInviteSheet() {
		inviteOpen = true;
		inviteEmail = '';
		inviteRoleIds = [];
		inviteError = null;
		inviteSuccess = false;
		inviteLoading = true;
		try {
			const res = await fetch(`${API_BASE}/roles?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const json = (await res.json()) as { data: Role[] };
				roles = json.data ?? [];
			}
		} finally {
			inviteLoading = false;
		}
	}

	async function submitInvite() {
		inviteError = null;
		inviteSuccess = false;
		const email = inviteEmail.trim();
		if (!email) {
			inviteError = 'Email is required';
			return;
		}
		inviteSubmitting = true;
		try {
			const body: { email: string; role_ids?: string[] } = { email };
			if (inviteRoleIds.length > 0) body.role_ids = inviteRoleIds;
			const res = await fetch(`${API_BASE}/invites`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const text = await res.text();
			if (!res.ok) {
				let msg = text;
				try {
					const j = JSON.parse(text);
					msg = j.message ?? text;
				} catch {}
				throw new Error(msg);
			}
			inviteSuccess = true;
			inviteEmail = '';
			inviteRoleIds = [];
			fetchInvites();
		} catch (e) {
			inviteError = e instanceof Error ? e.message : String(e);
		} finally {
			inviteSubmitting = false;
		}
	}

	async function resendInvite(invite: Invite) {
		if (invite.accepted) return;
		resendingId = invite.id;
		try {
			const res = await fetch(`${API_BASE}/invites/${invite.id}/resend`, { method: 'POST' });
			const text = await res.text();
			if (!res.ok) {
				let msg = text;
				try {
					const j = JSON.parse(text);
					msg = j.message ?? text;
				} catch {}
				throw new Error(msg);
			}
			fetchInvites();
		} finally {
			resendingId = null;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Mail class="size-4" />
				<span class="font-semibold">Invites</span>
			</div>
			<Button size="sm" onclick={openInviteSheet}>Invite user</Button>
		</div>
		<PaginationTable>
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

<Sheet.Root bind:open={inviteOpen}>
	<Sheet.Content side="right" class="flex h-full max-h-dvh w-full max-w-lg flex-col sm:max-w-lg">
		<div class="flex min-h-0 flex-1 flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Invite user</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Send an invite by email. Optionally assign roles.
				</p>
			</div>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					submitInvite();
				}}
				class="flex min-h-0 flex-1 flex-col"
			>
				<div class="min-h-0 flex-1 overflow-auto">
					<div class="space-y-4 px-6 py-6">
						<div class="space-y-2">
							<label for="invite-email" class="block text-sm font-medium">Email</label>
							<Input
								id="invite-email"
								type="email"
								placeholder="user@example.com"
								class="w-full"
								bind:value={inviteEmail}
								disabled={inviteSubmitting}
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="invite-role" class="block text-sm font-medium">Roles (optional)</label>
							{#if inviteLoading}
								<p class="text-sm text-muted-foreground">Loading roles…</p>
							{:else}
								<MultiSelectCombobox
									id="invite-role"
									options={roles.map((r) => ({ id: r.id, value: r.name }))}
									bind:value={inviteRoleIds}
									placeholder="Select roles…"
									disabled={inviteSubmitting}
								/>
							{/if}
						</div>
						{#if inviteError}
							<p class="text-sm text-destructive">{inviteError}</p>
						{/if}
						{#if inviteSuccess}
							<p class="text-sm text-green-600 dark:text-green-400">Invite sent successfully.</p>
						{/if}
					</div>
				</div>
				<div class="flex shrink-0 justify-end gap-2 border-t p-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (inviteOpen = false)}
						disabled={inviteSubmitting}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={inviteSubmitting}>
						{inviteSubmitting ? 'Sending…' : 'Send invite'}
					</Button>
				</div>
			</form>
		</div>
	</Sheet.Content>
</Sheet.Root>
