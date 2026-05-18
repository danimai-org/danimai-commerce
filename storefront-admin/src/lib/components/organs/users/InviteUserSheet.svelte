<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import MultiSelectCombobox from '$lib/components/organs/multi-select-combobox/multi-select-combobox.svelte';
	import { client } from '$lib/client.js';
	import { SvelteMap } from 'svelte/reactivity';

	type Role = {
		id: string;
		name: string;
		description: string;
		created_at: Date;
		updated_at: Date;
		deleted_at: Date | null;
	};

	const SEARCH_DEBOUNCE_MS = 320;

	let {
		open = $bindable(false),
		onInvited
	}: {
		open: boolean;
		onInvited?: () => void;
	} = $props();

	let email = $state('');
	let roleIds = $state<string[]>([]);
	let roles = $state<Role[]>([]);
	let roleLabelCache = $state<Record<string, string>>({});
	let rolesLoading = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	let prevOpen = $state(false);

	let rolesFetchGeneration = $state(0);
	let rolesSearchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	function parseClientError(
		result: { error?: { value?: { message?: string } } },
		fallback: string
	) {
		const msg = result?.error?.value?.message;
		return typeof msg === 'string' && msg.trim().length > 0 ? msg : fallback;
	}

	function mergeCachedLabels(rows: Role[]) {
		const next = { ...roleLabelCache };
		for (const r of rows) next[r.id] = r.name;
		roleLabelCache = next;
	}

	async function fetchRoles(search: string) {
		const gen = ++rolesFetchGeneration;
		rolesLoading = true;
		try {
			const res = await client.roles.get({
				query: {
					search: search.trim(),
					limit: 50,
					page: 1
				} as Record<string, unknown>
			});
			if (gen !== rolesFetchGeneration) return;
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to load roles'));
			}
			const rows = ((res.data as { rows?: Role[] } | null)?.rows ?? []) as Role[];
			roles = rows;
			mergeCachedLabels(rows);
		} catch (e) {
			if (gen !== rolesFetchGeneration) return;
			error = e instanceof Error ? e.message : String(e);
			roles = [];
		} finally {
			if (gen === rolesFetchGeneration) rolesLoading = false;
		}
	}

	function scheduleRoleSearch(query: string) {
		clearTimeout(rolesSearchDebounceTimer);
		rolesSearchDebounceTimer = setTimeout(() => {
			void fetchRoles(query);
		}, SEARCH_DEBOUNCE_MS);
	}

	$effect(() => {
		const justOpened = open && !prevOpen;
		prevOpen = open;
		if (!justOpened) return;

		clearTimeout(rolesSearchDebounceTimer);
		rolesSearchDebounceTimer = undefined;

		email = '';
		roleIds = [];
		roles = [];
		roleLabelCache = {};
		error = null;
		rolesLoading = false;
		rolesFetchGeneration++;
	});

	$effect(() => {
		if (!open) {
			clearTimeout(rolesSearchDebounceTimer);
		}
	});

	const roleComboboxOptions = $derived.by(() => {
		const map = new SvelteMap<string, { id: string; value: string }>();
		for (const r of roles) map.set(r.id, { id: r.id, value: r.name });
		for (const id of roleIds) {
			if (!map.has(id)) map.set(id, { id, value: roleLabelCache[id] ?? id });
		}
		return [...map.values()];
	});

	async function submit() {
		error = null;
		const trimmed = email.trim();
		if (!trimmed) {
			error = 'Email is required';
			return;
		}
		submitting = true;
		try {
			const body: { email: string; role_id?: string } = { email: trimmed };
			if (roleIds.length > 0) body.role_id = roleIds[0];
			const res = await client.invites.post(body as { email: string; role_ids?: string[] });
			if (res.error) {
				throw new Error(parseClientError(res, 'Failed to send invite'));
			}
			open = false;
			onInvited?.();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Invite user</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Send an invite by email. Optionally assign a role.
				</p>
			</div>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					submit();
				}}
				class="flex h-full flex-col"
			>
				<div class="min-h-0 flex-1 space-y-4 overflow-auto px-6 py-6">
					<div class="space-y-2">
						<label for="invite-email" class="block text-sm font-medium">Email</label>
						<Input
							id="invite-email"
							type="email"
							placeholder="user@example.com"
							class="w-full"
							bind:value={email}
							disabled={submitting}
							required
						/>
					</div>
					<div class="space-y-2">
						<label for="invite-role" class="block text-sm font-medium">Role (optional)</label>
						<MultiSelectCombobox
							id="invite-role"
							options={roleComboboxOptions}
							filterFn={(opts) => opts}
							bind:value={roleIds}
							placeholder="Search roles…"
							disabled={submitting}
							loading={rolesLoading}
							emptyMessage="No roles match your search."
							onOpen={() => void fetchRoles('')}
							onSearchChange={(query) => scheduleRoleSearch(query)}
						/>
					</div>
					{#if error}
						<p class="text-sm text-destructive">{error}</p>
					{/if}
				</div>
				<div class="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (open = false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting ? 'Sending…' : 'Send invite'}
					</Button>
				</div>
			</form>
		</div>
	</Sheet.Content>
</Sheet.Root>
