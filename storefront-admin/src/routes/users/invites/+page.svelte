<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Mail from '@lucide/svelte/icons/mail';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';

	const API_BASE = 'http://localhost:8000';

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
	let inviteRoleId = $state<string | null>(null);
	let roles = $state<Role[]>([]);
	let inviteLoading = $state(false);
	let inviteSubmitting = $state(false);
	let inviteError = $state<string | null>(null);
	let inviteSuccess = $state(false);

	let searchQuery = $state('');
	let invitesData = $state<{ data: Invite[]; pagination: Pagination } | null>(null);
	let invitesLoading = $state(true);
	let invitesError = $state<string | null>(null);
	let page = $state(1);
	const limit = 10;
	let resendingId = $state<string | null>(null);

	async function fetchInvites() {
		invitesLoading = true;
		invitesError = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			const res = await fetch(`${API_BASE}/invites?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			invitesData = (await res.json()) as { data: Invite[]; pagination: Pagination };
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

	const invites = $derived(invitesData?.data ?? []);
	const pagination = $derived(invitesData?.pagination ?? null);

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function isExpired(expiresAt: string) {
		return new Date(expiresAt) < new Date();
	}

	async function openInviteSheet() {
		inviteOpen = true;
		inviteEmail = '';
		inviteRoleId = null;
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
			const body: { email: string; role_id?: string } = { email };
			if (inviteRoleId) body.role_id = inviteRoleId;
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
			inviteRoleId = null;
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
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2">
					<div class="relative w-64">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={searchQuery}
							class="h-9 rounded-md pl-9"
						/>
					</div>
					<button
						type="button"
						class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				</div>
			</div>
		</div>

		{#if invitesLoading}
			<p class="text-sm text-muted-foreground">Loading invites…</p>
		{:else if invitesError}
			<p class="text-sm text-destructive">{invitesError}</p>
		{:else if invites.length === 0}
			<div class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
				No invites yet. Click "Invite user" to send your first invite.
			</div>
		{:else}
			<div class="rounded-lg border">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b bg-muted/50">
								<th class="px-4 py-3 text-left font-medium">Email</th>
								<th class="px-4 py-3 text-left font-medium">Role</th>
								<th class="px-4 py-3 text-left font-medium">Status</th>
								<th class="px-4 py-3 text-left font-medium">Expires</th>
								<th class="px-4 py-3 text-left font-medium">Created</th>
								<th class="px-4 py-3 text-right font-medium">Actions</th>
							</tr>
						</thead>
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
					<div class="flex items-center justify-between border-t px-4 py-3">
						<p class="text-sm text-muted-foreground">
							Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(
								pagination.page * pagination.limit,
								pagination.total
							)} of {pagination.total}
						</p>
						<div class="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={!pagination.has_previous_page}
								onclick={() => (page = page - 1)}
							>
								Previous
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={!pagination.has_next_page}
								onclick={() => (page = page + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<Sheet.Root bind:open={inviteOpen}>
	<Sheet.Content side="right" class="flex h-full max-h-dvh w-full max-w-lg flex-col sm:max-w-lg">
		<div class="flex min-h-0 flex-1 flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Invite user</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Send an invite by email. Optionally assign a role.
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
							<label for="invite-role" class="block text-sm font-medium">Role (optional)</label>
							{#if inviteLoading}
								<p class="text-sm text-muted-foreground">Loading roles…</p>
							{:else}
								<Select.Root
									type="single"
									value={inviteRoleId ?? undefined}
									onValueChange={(v) => (inviteRoleId = v ?? null)}
									allowDeselect
									disabled={inviteSubmitting}
								>
									<Select.Trigger id="invite-role" class="w-full">
										{#if inviteRoleId && roles.find((r) => r.id === inviteRoleId)}
											{roles.find((r) => r.id === inviteRoleId)?.name}
										{:else}
											Select role
										{/if}
									</Select.Trigger>
									<Select.Content>
										{#each roles as role (role.id)}
											<Select.Item value={role.id} label={role.name}>{role.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
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
