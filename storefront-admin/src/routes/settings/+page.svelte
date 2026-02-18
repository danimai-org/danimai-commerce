<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import { DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { getAccessToken, user as userStore } from '$lib/auth.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

	type Profile = {
		firstName: string;
		lastName: string;
		email: string;
	};

	let profile = $state<Profile>({
		firstName: '',
		lastName: '',
		email: '',
	});

	let loading = $state(true);
	let editOpen = $state(false);
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let userId = $state<string | null>(null);

	let draftFirstName = $state('');
	let draftLastName = $state('');

	onMount(async () => {
		const token = getAccessToken();
		if (!token) return;
		
		// Initialize from user store as fallback
		const storedUser = get(userStore);
		if (storedUser?.id) {
			userId = storedUser.id;
		}
		if (storedUser?.email) {
			profile.email = storedUser.email;
		}
		
		try {
			const res = await fetch(`${API_BASE}/auth/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const user = (await res.json()) as {
					id?: string;
					first_name?: string | null;
					last_name?: string | null;
					email?: string | null;
				};
				if (user.id) {
					userId = user.id;
				}
				// Ensure we handle null/undefined values correctly - convert null to empty string
				profile = {
					firstName: user.first_name ?? '',
					lastName: user.last_name ?? '',
					email: user.email ?? storedUser?.email ?? '',
				};
			} else {
				console.error('Failed to fetch profile on mount:', res.status, await res.text());
			}
		} catch (error) {
			console.error('Error fetching profile on mount:', error);
		} finally {
			loading = false;
		}
	});

	async function fetchProfile() {
		const token = getAccessToken();
		if (!token) return;
		
		const storedUser = get(userStore);
		try {
			const res = await fetch(`${API_BASE}/auth/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const user = (await res.json()) as {
					id?: string;
					first_name?: string | null;
					last_name?: string | null;
					email?: string | null;
				};
				if (user.id) {
					userId = user.id;
				}
				// Ensure we handle null/undefined values correctly - convert null to empty string
				profile = {
					firstName: user.first_name ?? '',
					lastName: user.last_name ?? '',
					email: user.email ?? storedUser?.email ?? '',
				};
			} else {
				console.error('Failed to fetch profile:', res.status, await res.text());
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
		}
	}

	function openEdit() {
		draftFirstName = profile.firstName;
		draftLastName = profile.lastName;
		editOpen = true;
	}

	async function saveProfile() {
		if (!userId) return;
		
		saving = true;
		saveError = null;
		
		try {
			const token = getAccessToken();
			if (!token) {
				saveError = 'Not authenticated';
				return;
			}
			
			const trimmedFirstName = draftFirstName.trim();
			const trimmedLastName = draftLastName.trim();
			
			// Send null for empty strings, otherwise send the trimmed value
			const payload = {
				first_name: trimmedFirstName === '' ? null : trimmedFirstName,
				last_name: trimmedLastName === '' ? null : trimmedLastName,
			};
			
			const res = await fetch(`${API_BASE}/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});
			
			if (!res.ok) {
				const text = await res.text();
				let msg = text;
				try {
					const j = JSON.parse(text);
					msg = j.message ?? text;
				} catch {}
				throw new Error(msg);
			}
			
			// Parse the response and update profile immediately
			const updatedUser = (await res.json()) as {
				id?: string;
				first_name?: string | null;
				last_name?: string | null;
				email?: string | null;
			};
			
			// Update profile state immediately from the response
			// Convert null to empty string for consistent display
			profile = {
				firstName: updatedUser.first_name ?? '',
				lastName: updatedUser.last_name ?? '',
				email: updatedUser.email ?? profile.email,
			};
			
			// Close the edit dialog
			editOpen = false;
		} catch (e) {
			console.error('Error saving profile:', e);
			saveError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

</script>

<div class="flex h-full flex-col p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<div class="mb-1 text-xs text-muted-foreground">Settings &gt; Profile</div>
			<h1 class="text-lg font-semibold leading-none">Profile</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Manage your profile details.
			</p>
		</div>
	</div>

	<div class="flex flex-1 justify-center">
		<!-- Profile card -->
		<div class="w-full max-w-3xl">
			<div class="rounded-lg border bg-card">
				<div class="flex items-center justify-between border-b px-6 py-4">
					<div>
						<h2 class="text-base font-medium">Profile</h2>
						<p class="text-sm text-muted-foreground">Manage your profile details.</p>
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
						>
							<MoreHorizontal class="size-4" />
							<span class="sr-only">Open profile menu</span>
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
								sideOffset={4}
							>
								<DropdownMenu.Item
									textValue="Edit"
									class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
									onSelect={openEdit}
								>
									<Pencil class="size-4" />
									Edit
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>

				<div class="divide-y text-sm">
					<div class="grid grid-cols-[160px,1fr] items-center px-6 py-3">
						<div class="text-muted-foreground">Name</div>
						<div>
							{#if loading}
								<span class="text-muted-foreground">Loading…</span>
							{:else if profile.firstName || profile.lastName}
								{`${profile.firstName} ${profile.lastName}`.trim()}
							{:else}
								-
							{/if}
						</div>
					</div>
					<div class="grid grid-cols-[160px,1fr] items-center px-6 py-3">
						<div class="text-muted-foreground">Email ID</div>
						<div>
							{#if loading}
								<span class="text-muted-foreground">Loading…</span>
							{:else if profile.email}
								{profile.email}
							{:else}
								-
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<Sheet.Root bind:open={editOpen}>
		<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
			<div class="flex h-full flex-col">
				<div class="border-b px-6 py-4">
					<h2 class="text-lg font-semibold">Edit Profile</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Update your profile details for the admin dashboard.
					</p>
				</div>
				<div class="flex-1 space-y-6 overflow-auto p-6">
					{#if saveError}
						<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{saveError}
						</div>
					{/if}
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-1">
							<label class="block text-sm font-medium" for="first-name">First Name</label>
							<Input id="first-name" bind:value={draftFirstName} />
						</div>
						<div class="space-y-1">
							<label class="block text-sm font-medium" for="last-name">Last Name</label>
							<Input id="last-name" bind:value={draftLastName} />
						</div>
					</div>
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button type="button" variant="outline" onclick={() => { 
						editOpen = false; 
						saveError = null;
						// Reset draft values to current profile when canceling
						draftFirstName = profile.firstName;
						draftLastName = profile.lastName;
					}} disabled={saving}>
						Cancel
					</Button>
					<Button type="button" onclick={saveProfile} disabled={saving}>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</div>
		</Sheet.Content>
	</Sheet.Root>
</div>
