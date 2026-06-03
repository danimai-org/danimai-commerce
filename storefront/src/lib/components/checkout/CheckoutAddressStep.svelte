<script lang="ts">
    import type {
        SuperFormData,
        SuperFormErrors,
    } from "sveltekit-superforms/client";
    import type {
        InputConstraints,
        ValidationErrors,
    } from "sveltekit-superforms";
    import type { Writable } from "svelte/store";
    import type { CheckoutFormData } from "$lib/checkout/checkout-form-schema";
    import type { CheckoutCountryOption } from "$lib/checkout/countries-api";

    interface Props {
        form: SuperFormData<CheckoutFormData>;
        errors: SuperFormErrors<CheckoutFormData>;
        constraints: Writable<InputConstraints<CheckoutFormData>>;
        countries?: CheckoutCountryOption[];
    }

    let { form, errors, constraints, countries = [] }: Props = $props();

    let err = $state<Record<string, unknown>>({});
    $effect(() => {
        const es = errors;
        const unsub = es.subscribe((v: ValidationErrors<CheckoutFormData>) => {
            err = v as Record<string, unknown>;
        });
        return unsub;
    });

    function fieldErr(v: unknown): string {
        if (v == null) return "";
        return Array.isArray(v) ? String(v[0] ?? "") : String(v);
    }
</script>

<div class="checkout-address addresses-form">
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
                    aria-invalid={err.firstName ? "true" : undefined}
                    data-invalid={err.firstName ? "" : undefined}
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
                    aria-invalid={err.lastName ? "true" : undefined}
                    data-invalid={err.lastName ? "" : undefined}
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
                aria-invalid={err.address1 ? "true" : undefined}
                data-invalid={err.address1 ? "" : undefined}
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
                    aria-invalid={err.city ? "true" : undefined}
                    data-invalid={err.city ? "" : undefined}
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
                    aria-invalid={err.state ? "true" : undefined}
                    data-invalid={err.state ? "" : undefined}
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
                    aria-invalid={err.postalCode ? "true" : undefined}
                    data-invalid={err.postalCode ? "" : undefined}
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
                aria-invalid={err.country ? "true" : undefined}
                data-invalid={err.country ? "" : undefined}
                {...$constraints.country}
            >
                {#each countries as country (country.code)}
                    <option value={country.code}>{country.name}</option>
                {/each}
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
            aria-invalid={err.email ? "true" : undefined}
            data-invalid={err.email ? "" : undefined}
            {...$constraints.email}
        />
        <p class="field-hint">You'll receive order updates to this email</p>
        {#if err.email}
            <p class="field-error">{fieldErr(err.email)}</p>
        {/if}
    </div>

    <button type="submit" class="next-btn full-width">Next</button>
</div>
