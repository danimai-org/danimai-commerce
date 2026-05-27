<script lang="ts">
	import { untrack } from 'svelte';

	export type AddressFormValues = {
		name: string;
		line1: string;
		line2: string;
		city: string;
		state: string;
		postal: string;
		phone: string;
		isDefault: boolean;
	};

	type Props = {
		open?: boolean;
		title?: string;
		seed?: string;
		initial?: Partial<AddressFormValues>;
		onClose?: () => void;
		onSave?: (values: AddressFormValues) => void;
	};

	const INDIAN_STATES = [
		'Andhra Pradesh',
		'Arunachal Pradesh',
		'Assam',
		'Bihar',
		'Chhattisgarh',
		'Goa',
		'Gujarat',
		'Haryana',
		'Himachal Pradesh',
		'Jharkhand',
		'Karnataka',
		'Kerala',
		'Madhya Pradesh',
		'Maharashtra',
		'Manipur',
		'Meghalaya',
		'Mizoram',
		'Nagaland',
		'Odisha',
		'Punjab',
		'Rajasthan',
		'Sikkim',
		'Tamil Nadu',
		'Telangana',
		'Tripura',
		'Uttar Pradesh',
		'Uttarakhand',
		'West Bengal',
		'Delhi',
		'Jammu and Kashmir',
		'Ladakh',
		'Puducherry',
		'Chandigarh'
	];

	let {
		open = false,
		title = 'Add Address',
		seed = 'new',
		initial = {},
		onClose,
		onSave
	}: Props = $props();

	let name = $state('');
	let line1 = $state('');
	let line2 = $state('');
	let city = $state('');
	let stateValue = $state('');
	let postal = $state('');
	let phone = $state('');
	let isDefault = $state(true);

	const applyInitial = (values: Partial<AddressFormValues>) => {
		name = values.name ?? '';
		line1 = values.line1 ?? '';
		line2 = values.line2 ?? '';
		city = values.city ?? '';
		stateValue = values.state ?? '';
		postal = values.postal ?? '';
		phone = values.phone ?? '';
		isDefault = values.isDefault ?? true;
	};

	$effect(() => {
		if (!open) return;
		seed;
		applyInitial(untrack(() => initial));
	});

	$effect(() => {
		if (!open || typeof document === 'undefined') return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose?.();
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = prev;
			document.removeEventListener('keydown', onKey);
		};
	});

	const isValid = $derived(
		name.trim().length > 0 &&
			line1.trim().length > 0 &&
			postal.trim().length > 0 &&
			city.trim().length > 0 &&
			stateValue.trim().length > 0 &&
			phone.trim().length > 0
	);

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
		if (!isValid) return;
		onSave?.({
			name: name.trim(),
			line1: line1.trim(),
			line2: line2.trim(),
			city: city.trim(),
			state: stateValue.trim(),
			postal: postal.trim(),
			phone: phone.trim(),
			isDefault
		});
	};
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="address-modal-root" role="presentation">
		<button type="button" class="address-modal-backdrop" aria-label="Close dialog" onclick={() => onClose?.()}></button>
		<div class="address-modal" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
			<header class="address-modal__header">
				<h2 id="address-modal-title" class="address-modal__title">{title}</h2>
				<button type="button" class="address-modal__close" aria-label="Close" onclick={() => onClose?.()}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M18 6 6 18" /><path d="m6 6 12 12" />
					</svg>
				</button>
			</header>

			<form class="address-modal__form" onsubmit={handleSubmit}>
				<label class="address-field address-field--full">
					<input bind:value={name} type="text" placeholder="Full name*" required autocomplete="name" />
				</label>

				<label class="address-field address-field--full">
					<input bind:value={line1} type="text" placeholder="Address*" required autocomplete="street-address" />
				</label>

				<label class="address-field address-field--full">
					<input
						bind:value={line2}
						type="text"
						placeholder="Apartment/Suite etc. (optional)"
						autocomplete="address-line2"
					/>
				</label>

				<div class="address-field-row">
					<label class="address-field">
						<input bind:value={postal} type="text" placeholder="Pincode*" required inputmode="numeric" autocomplete="postal-code" />
					</label>
					<label class="address-field">
						<input bind:value={city} type="text" placeholder="City*" required autocomplete="address-level2" />
					</label>
				</div>

				<div class="address-field-row">
					<label class="address-field address-field--select">
						<select bind:value={stateValue} required>
							<option value="" disabled selected hidden>State*</option>
							{#each INDIAN_STATES as stateOption}
								<option value={stateOption}>{stateOption}</option>
							{/each}
						</select>
						<svg class="address-field__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path d="m6 9 6 6 6-6" />
						</svg>
					</label>
					<label class="address-field">
						<input type="text" value="India" readonly tabindex="-1" aria-readonly="true" />
					</label>
				</div>

				<label class="address-field address-field--full address-field--phone">
					<span class="address-phone-prefix" aria-hidden="true">+91</span>
					<input
						bind:value={phone}
						type="tel"
						placeholder="Enter your phone number*"
						required
						autocomplete="tel-national"
						inputmode="tel"
					/>
				</label>

				<label class="address-default">
					<input type="checkbox" bind:checked={isDefault} />
					<span class="address-default__box" aria-hidden="true"></span>
					<span>Set as default address</span>
				</label>

				<button type="submit" class="address-modal__submit" disabled={!isValid}>Save Address</button>
			</form>
		</div>
	</div>
{/if}
