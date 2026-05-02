<script lang="ts">
	import type {
		SuperFormData,
		SuperFormErrors,
	} from 'sveltekit-superforms/client';
	import type { InputConstraints, ValidationErrors } from 'sveltekit-superforms';
	import type { Writable } from 'svelte/store';
	import type { CheckoutFormData } from '$lib/checkout/checkout-form-schema';

	interface Props {
		form: SuperFormData<CheckoutFormData>;
		errors: SuperFormErrors<CheckoutFormData>;
		constraints: Writable<InputConstraints<CheckoutFormData>>;
	}

	let { form, errors, constraints }: Props = $props();

	// Svelte 5: `$errors` from props is not reliably reactive; mirror the store into state.
	let err = $state<Record<string, unknown>>({});
	$effect(() => {
		const es = errors;
		const unsub = es.subscribe((v: ValidationErrors<CheckoutFormData>) => {
			err = v as Record<string, unknown>;
		});
		return unsub;
	});

	function fieldErr(v: unknown): string {
		if (v == null) return '';
		return Array.isArray(v) ? String(v[0] ?? '') : String(v);
	}
</script>

<div class="addresses-form">
	<fieldset class="fieldset-shipping">
		<legend class="visually-hidden">Shipping address</legend>
		<div class="form-row form-row-two">
			<div class="field">
				<label for="shipping-first-name">First Name</label>
				<input
					id="shipping-first-name"
					name="firstName"
					type="text"
					bind:value={$form.firstName}
					placeholder="First name"
					aria-invalid={err.firstName ? 'true' : undefined}
					data-invalid={err.firstName ? '' : undefined}
					{...$constraints.firstName}
				/>
				{#if err.firstName}
					<p class="field-error">{fieldErr(err.firstName)}</p>
				{/if}
			</div>
			<div class="field">
				<label for="shipping-last-name">Last Name</label>
				<input
					id="shipping-last-name"
					name="lastName"
					type="text"
					bind:value={$form.lastName}
					placeholder="Last name"
					aria-invalid={err.lastName ? 'true' : undefined}
					data-invalid={err.lastName ? '' : undefined}
					{...$constraints.lastName}
				/>
				{#if err.lastName}
					<p class="field-error">{fieldErr(err.lastName)}</p>
				{/if}
			</div>
		</div>
		<div class="field">
			<label for="shipping-company">Company</label>
			<input
				id="shipping-company"
				name="company"
				type="text"
				bind:value={$form.company}
				placeholder="Company name"
				{...$constraints.company}
			/>
		</div>
		<div class="field">
			<label for="shipping-address1">Address Line 1</label>
			<input
				id="shipping-address1"
				name="address1"
				type="text"
				bind:value={$form.address1}
				placeholder="Address line 1"
				aria-invalid={err.address1 ? 'true' : undefined}
				data-invalid={err.address1 ? '' : undefined}
				{...$constraints.address1}
			/>
			{#if err.address1}
				<p class="field-error">{fieldErr(err.address1)}</p>
			{/if}
		</div>
		<div class="field">
			<label for="shipping-address2">Address Line 2</label>
			<input
				id="shipping-address2"
				name="address2"
				type="text"
				bind:value={$form.address2}
				placeholder="Address line 2"
				{...$constraints.address2}
			/>
		</div>
		<div class="form-row form-row-three">
			<div class="field">
				<label for="shipping-city">City</label>
				<input
					id="shipping-city"
					name="city"
					type="text"
					bind:value={$form.city}
					placeholder="City"
					aria-invalid={err.city ? 'true' : undefined}
					data-invalid={err.city ? '' : undefined}
					{...$constraints.city}
				/>
				{#if err.city}
					<p class="field-error">{fieldErr(err.city)}</p>
				{/if}
			</div>
			<div class="field">
				<label for="shipping-state">State / Province</label>
				<input
					id="shipping-state"
					name="state"
					type="text"
					bind:value={$form.state}
					placeholder="State / Province"
					aria-invalid={err.state ? 'true' : undefined}
					data-invalid={err.state ? '' : undefined}
					{...$constraints.state}
				/>
				{#if err.state}
					<p class="field-error">{fieldErr(err.state)}</p>
				{/if}
			</div>
			<div class="field">
				<label for="shipping-postal">Postal Code</label>
				<input
					id="shipping-postal"
					name="postalCode"
					type="text"
					bind:value={$form.postalCode}
					placeholder="Postal code"
					aria-invalid={err.postalCode ? 'true' : undefined}
					data-invalid={err.postalCode ? '' : undefined}
					{...$constraints.postalCode}
				/>
				{#if err.postalCode}
					<p class="field-error">{fieldErr(err.postalCode)}</p>
				{/if}
			</div>
		</div>
		<div class="field">
			<label for="shipping-country">Country</label>
			<select
				id="shipping-country"
				name="country"
				bind:value={$form.country}
				aria-invalid={err.country ? 'true' : undefined}
				data-invalid={err.country ? '' : undefined}
				{...$constraints.country}
			>
				<option>United States</option>
				<option>Canada</option>
				<option>United Kingdom</option>
			</select>
			{#if err.country}
				<p class="field-error">{fieldErr(err.country)}</p>
			{/if}
		</div>
		<div class="field">
			<label for="shipping-phone">Phone</label>
			<input
				id="shipping-phone"
				name="phone"
				type="tel"
				bind:value={$form.phone}
				placeholder="Phone number"
				{...$constraints.phone}
			/>
		</div>
	</fieldset>

	<label class="checkbox-row">
		<input
			type="checkbox"
			name="billingSameAsShipping"
			bind:checked={$form.billingSameAsShipping}
		/>
		<span>Billing address is the same as shipping address</span>
	</label>

	<div class="field email-field">
		<label for="email">Email Address</label>
		<input
			id="email"
			name="email"
			type="email"
			bind:value={$form.email}
			placeholder="Email address"
			aria-invalid={err.email ? 'true' : undefined}
			data-invalid={err.email ? '' : undefined}
			{...$constraints.email}
		/>
		<p class="field-hint">You'll receive order updates to this email</p>
		{#if err.email}
			<p class="field-error">{fieldErr(err.email)}</p>
		{/if}
	</div>

	<button type="submit" class="next-btn full-width">Next</button>
</div>

<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.addresses-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.fieldset-shipping {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.form-row {
		display: grid;
		gap: 1rem;
	}
	.form-row-two {
		grid-template-columns: 1fr 1fr;
	}
	.form-row-three {
		grid-template-columns: 1fr 1fr 1fr;
	}
	.field label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #333;
		margin-bottom: 0.35rem;
	}
	.field input,
	.field select {
		width: 100%;
		padding: 0.65rem 0.75rem;
		font-size: 0.9375rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: #fff;
		color: #1a1a1a;
		font-family: inherit;
		box-sizing: border-box;
	}
	.field input::placeholder {
		color: #999;
	}
	.field input:focus,
	.field select:focus {
		outline: none;
		border-color: #2d2d2d;
	}
	.field input[aria-invalid='true'],
	.field select[aria-invalid='true'] {
		border-color: #b42318;
		box-shadow: 0 0 0 1px #b42318;
	}
	.field-hint {
		font-size: 0.8125rem;
		color: #888;
		margin: 0.35rem 0 0;
	}
	.field-error {
		margin: 0.35rem 0 0;
		font-size: 0.8125rem;
		color: #b42318;
	}
	.checkbox-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		color: #333;
		cursor: pointer;
	}
	.checkbox-row input {
		width: auto;
	}
	.email-field {
		margin-top: 0.5rem;
	}
	.next-btn.full-width {
		width: 100%;
		background: #2d2d2d;
		color: #fff;
		border: none;
		padding: 1rem 1.5rem;
		margin-top: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: 0;
	}
	.next-btn.full-width:hover {
		background: #1a1a1a;
	}
	@media (max-width: 640px) {
		.form-row-two,
		.form-row-three {
			grid-template-columns: 1fr;
		}
	}
</style>
