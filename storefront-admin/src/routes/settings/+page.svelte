<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import { DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { getAccessToken } from '$lib/auth.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

	type Profile = {
		firstName: string;
		lastName: string;
		email: string;
		language: string;
	};

	let profile = $state<Profile>({
		firstName: '',
		lastName: '',
		email: '',
		language: 'English',
	});

	let loading = $state(true);
	let editOpen = $state(false);

	let draftFirstName = $state('');
	let draftLastName = $state('');
	let draftLanguage = $state('English');

	$effect(() => {
		draftFirstName = profile.firstName;
		draftLastName = profile.lastName;
		draftLanguage = profile.language;
	});

	onMount(async () => {
		const token = getAccessToken();
		if (!token) return;
		try {
			const res = await fetch(`${API_BASE}/auth/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const user = (await res.json()) as {
					first_name?: string | null;
					last_name?: string | null;
					email?: string;
				};
				profile = {
					firstName: user.first_name ?? '',
					lastName: user.last_name ?? '',
					email: user.email ?? '',
					language: profile.language,
				};
			}
		} catch {
			/* ignore */
		} finally {
			loading = false;
		}
	});

	function openEdit() {
		draftFirstName = profile.firstName;
		draftLastName = profile.lastName;
		draftLanguage = profile.language;
		editOpen = true;
	}

	function saveProfile() {
		profile = {
			...profile,
			firstName: draftFirstName.trim(),
			lastName: draftLastName.trim(),
			language: draftLanguage,
		};
		editOpen = false;
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
						<div class="text-muted-foreground">Email</div>
						<div>
							{#if loading}
								<span class="text-muted-foreground">Loading…</span>
							{:else}
								{profile.email || '-'}
							{/if}
						</div>
					</div>
					<div class="grid grid-cols-[160px,1fr] items-center px-6 py-3">
						<div class="text-muted-foreground">Language</div>
						<div>{profile.language}</div>
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
					<div class="space-y-1">
						<label class="block text-sm font-medium" for="language">Language</label>
						<select
							id="language"
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
							bind:value={draftLanguage}
						>
							<option value="English">English</option>
						</select>
						<p class="text-xs text-muted-foreground">
							The language you want to use in the admin dashboard. This doesn't change the language
							of your store.
						</p>
					</div>
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button type="button" variant="outline" onclick={() => (editOpen = false)}>
						Cancel
					</Button>
					<Button type="button" onclick={saveProfile}>
						Save
					</Button>
				</div>
			</div>
		</Sheet.Content>
	</Sheet.Root>
</div>
