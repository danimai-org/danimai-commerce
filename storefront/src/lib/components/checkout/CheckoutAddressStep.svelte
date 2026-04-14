<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';

	type ShippingAddress = {
		firstName: string;
		lastName: string;
		company: string;
		address1: string;
		address2: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
		phone: string;
	};

	type Props = {
		shipping: ShippingAddress;
		billingSameAsShipping?: boolean;
		email?: string;
		onNext: () => void;
	};

	let {
		shipping = $bindable(),
		billingSameAsShipping = $bindable(true),
		email = $bindable(''),
		onNext
	}: Props = $props();

	const initialFormData = $state.snapshot({
		firstName: shipping.firstName,
		lastName: shipping.lastName,
		company: shipping.company,
		address1: shipping.address1,
		address2: shipping.address2,
		city: shipping.city,
		state: shipping.state,
		postalCode: shipping.postalCode,
		country: shipping.country,
		phone: shipping.phone,
		billingSameAsShipping,
		email
	});

	const { form, errors, enhance } = superForm(initialFormData, {
		SPA: true,
		resetForm: false,
		onSubmit: ({ cancel }) => {
			$errors.firstName = $form.firstName.trim() ? undefined : ['First name is required'];
			$errors.lastName = $form.lastName.trim() ? undefined : ['Last name is required'];
			$errors.address1 = $form.address1.trim() ? undefined : ['Address line 1 is required'];
			$errors.city = $form.city.trim() ? undefined : ['City is required'];
			$errors.state = $form.state.trim() ? undefined : ['State / Province is required'];
			$errors.postalCode = $form.postalCode.trim() ? undefined : ['Postal code is required'];
			$errors.country = $form.country.trim() ? undefined : ['Country is required'];
			$errors.email = !$form.email.trim()
				? ['Email is required']
				: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($form.email)
					? undefined
					: ['Enter a valid email address'];

			const hasErrors = Object.values($errors).some((value) => Boolean(value));
			if (hasErrors) {
				cancel();
				return;
			}

			shipping = {
				firstName: $form.firstName,
				lastName: $form.lastName,
				company: $form.company,
				address1: $form.address1,
				address2: $form.address2,
				city: $form.city,
				state: $form.state,
				postalCode: $form.postalCode,
				country: $form.country,
				phone: $form.phone
			};
			billingSameAsShipping = $form.billingSameAsShipping;
			email = $form.email;
			onNext();
		}
	});
</script>

<form class="addresses-form" method="POST" use:enhance>
	<fieldset class="fieldset-shipping">
		<legend class="visually-hidden">Shipping address</legend>
		<div class="form-row form-row-two">
			<div class="field">
				<label for="shipping-first-name">First Name</label>
				<input id="shipping-first-name" type="text" bind:value={$form.firstName} placeholder="First name" />
				{#if $errors.firstName}
					<p class="field-error">{$errors.firstName[0]}</p>
				{/if}
			</div>
			<div class="field">
				<label for="shipping-last-name">Last Name</label>
				<input id="shipping-last-name" type="text" bind:value={$form.lastName} placeholder="Last name" />
				{#if $errors.lastName}
					<p class="field-error">{$errors.lastName[0]}</p>
				{/if}
			</div>
		</div>
		<div class="field">
			<label for="shipping-company">Company</label>
			<input id="shipping-company" type="text" bind:value={$form.company} placeholder="Company name" />
		</div>
		<div class="field">
			<label for="shipping-address1">Address Line 1</label>
			<input id="shipping-address1" type="text" bind:value={$form.address1} placeholder="Address line 1" />
			{#if $errors.address1}
				<p class="field-error">{$errors.address1[0]}</p>
			{/if}
		</div>
		<div class="field">
			<label for="shipping-address2">Address Line 2</label>
			<input id="shipping-address2" type="text" bind:value={$form.address2} placeholder="Address line 2" />
		</div>
		<div class="form-row form-row-three">
			<div class="field">
				<label for="shipping-city">City</label>
				<input id="shipping-city" type="text" bind:value={$form.city} placeholder="City" />
				{#if $errors.city}
					<p class="field-error">{$errors.city[0]}</p>
				{/if}
			</div>
			<div class="field">
				<label for="shipping-state">State / Province</label>
				<input id="shipping-state" type="text" bind:value={$form.state} placeholder="State / Province" />
				{#if $errors.state}
					<p class="field-error">{$errors.state[0]}</p>
				{/if}
			</div>
			<div class="field">
				<label for="shipping-postal">Postal Code</label>
				<input id="shipping-postal" type="text" bind:value={$form.postalCode} placeholder="Postal code" />
				{#if $errors.postalCode}
					<p class="field-error">{$errors.postalCode[0]}</p>
				{/if}
			</div>
		</div>
		<div class="field">
			<label for="shipping-country">Country</label>
			<select id="shipping-country" bind:value={$form.country}>
				<option>United States</option>
				<option>Canada</option>
				<option>United Kingdom</option>
			</select>
			{#if $errors.country}
				<p class="field-error">{$errors.country[0]}</p>
			{/if}
		</div>
		<div class="field">
			<label for="shipping-phone">Phone</label>
			<input id="shipping-phone" type="tel" bind:value={$form.phone} placeholder="Phone number" />
		</div>
	</fieldset>

	<label class="checkbox-row">
		<input type="checkbox" bind:checked={$form.billingSameAsShipping} />
		<span>Billing address is the same as shipping address</span>
	</label>

	<div class="field email-field">
		<label for="email">Email Address</label>
		<input id="email" type="email" bind:value={$form.email} placeholder="Email address" />
		<p class="field-hint">You'll receive order updates to this email</p>
		{#if $errors.email}
			<p class="field-error">{$errors.email[0]}</p>
		{/if}
	</div>

	<button type="submit" class="next-btn full-width">Next</button>
</form>

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
