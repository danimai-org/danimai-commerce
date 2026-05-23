<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { updateCustomer } from '$lib/customers/api.js';
	import type { Customer } from '$lib/customers/api.js';

	let {
		open = $bindable(false),
		customer = null as Customer | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		customer?: Customer | null;
		onSuccess?: () => void;
	} = $props();

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let company = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open && customer) {
			error = null;
			firstName = customer.first_name ?? '';
			lastName = customer.last_name ?? '';
			email = customer.email;
			phone = customer.phone ?? '';
			company = (customer.metadata as { company?: string })?.company ?? '';
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		if (!customer) return;
		error = null;
		if (!email.trim()) {
			error = 'Email is required';
			return;
		}
		submitting = true;
		try {
			await updateCustomer(customer.id, {
				email: email.trim(),
				first_name: firstName.trim() || null,
				last_name: lastName.trim() || null,
				phone: phone.trim() || null,
				...(company.trim() && { metadata: { company: company.trim() } })
			});
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const submitLabel = $derived(submitting ? 'Saving…' : 'Save');
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<Sheet.Title>Edit Customer</Sheet.Title>
				<Sheet.Description>Update customer details.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-auto px-6 py-6">
				{#if error}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="cf-first-name" class="text-sm font-medium">
								First Name <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="cf-first-name"
								bind:value={firstName}
								placeholder="First name"
								class="h-9"
								disabled={submitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="cf-last-name" class="text-sm font-medium">
								Last Name <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="cf-last-name"
								bind:value={lastName}
								placeholder="Last name"
								class="h-9"
								disabled={submitting}
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="cf-email" class="text-sm font-medium">Email</label>
						<Input
							id="cf-email"
							type="email"
							bind:value={email}
							placeholder="Email"
							class="h-9"
							disabled={submitting}
							required
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="cf-phone" class="text-sm font-medium">
								Phone <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="cf-phone"
								type="tel"
								bind:value={phone}
								placeholder="Phone"
								class="h-9"
								disabled={submitting}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="cf-company" class="text-sm font-medium">
								Company <span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<Input
								id="cf-company"
								bind:value={company}
								placeholder="Company"
								class="h-9"
								disabled={submitting}
							/>
						</div>
					</div>
				</div>
			</div>

			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close} disabled={submitting}>Cancel</Button>
				<Button onclick={submit} disabled={submitting}>
					{submitLabel}
				</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
