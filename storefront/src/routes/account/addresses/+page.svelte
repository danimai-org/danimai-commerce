<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import {
        ACCOUNT_UPDATED_EVENT,
        CustomerAuthError,
        createCustomerAddress,
        deleteCustomerAddress,
        ensureCustomerDefaultAddress,
        hasCustomerAuthSession,
        listCustomerAddresses,
        notifyAccountUpdated,
        savedAddressToFormInput,
        setDefaultCustomerAddress,
        updateCustomerAddress,
        type CustomerSavedAddress,
    } from "$lib/account/storage";
    import {
        AddAddressModal,
        type AddressFormValues,
    } from "$lib/components/account";

    let addresses = $state<CustomerSavedAddress[]>([]);
    let addressModalOpen = $state(false);
    let editingId = $state<string | null>(null);
    let loading = $state(false);
    let error = $state("");
    let actionPending = $state(false);

    const sortDefaultFirst = (
        items: CustomerSavedAddress[],
    ): CustomerSavedAddress[] =>
        [...items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

    const applyLoadedAddresses = (items: CustomerSavedAddress[]) => {
        addresses = sortDefaultFirst(items);
    };

    const redirectToLoginIfUnauthenticated = async () => {
        if (!hasCustomerAuthSession()) {
            await goto("/login");
        }
    };

    const loadAddresses = async () => {
        if (!browser) return;
        if (!hasCustomerAuthSession()) {
            error = "Please log in to view your addresses.";
            addresses = [];
            await goto("/login");
            return;
        }

        loading = true;
        error = "";
        try {
            const rows = await ensureCustomerDefaultAddress(
                await listCustomerAddresses(),
            );
            applyLoadedAddresses(rows);
        } catch (e) {
            if (e instanceof CustomerAuthError) {
                error = e.message;
                await redirectToLoginIfUnauthenticated();
                return;
            }
            error =
                e instanceof Error ? e.message : "Failed to load addresses.";
        } finally {
            loading = false;
        }
    };

    $effect(() => {
        if (!browser) return;
        void loadAddresses();

        const onAccountUpdated = () => {
            void loadAddresses();
        };
        window.addEventListener(ACCOUNT_UPDATED_EVENT, onAccountUpdated);
        return () =>
            window.removeEventListener(ACCOUNT_UPDATED_EVENT, onAccountUpdated);
    });

    const modalTitle = $derived(editingId ? "Edit Address" : "Add Address");

    const modalInitial = $derived.by((): Partial<AddressFormValues> => {
        if (!editingId) {
            return { isDefault: addresses.length === 0 };
        }
        const entry = addresses.find((item) => item.id === editingId);
        if (!entry) return {};
        return {
            name: entry.name,
            line1: entry.line1,
            line2: entry.line2,
            city: entry.city,
            state: entry.state,
            postal: entry.postal,
            phone: entry.phone,
            isDefault: entry.isDefault,
        };
    });

    const openAddModal = () => {
        editingId = null;
        addressModalOpen = true;
    };

    const openEditModal = (entry: CustomerSavedAddress) => {
        editingId = entry.id;
        addressModalOpen = true;
    };

    const closeModal = () => {
        addressModalOpen = false;
        editingId = null;
    };

    const formatCityStatePostal = (entry: CustomerSavedAddress): string =>
        [entry.city, entry.state, entry.postal].filter(Boolean).join(", ");

    const saveAddress = async (values: AddressFormValues) => {
        actionPending = true;
        error = "";
        try {
            if (editingId) {
                await updateCustomerAddress(editingId, values);
            } else {
                await createCustomerAddress(values);
            }
            await loadAddresses();
            notifyAccountUpdated();
            closeModal();
        } catch (e) {
            if (e instanceof CustomerAuthError) {
                await redirectToLoginIfUnauthenticated();
                return;
            }
            error = e instanceof Error ? e.message : "Failed to save address.";
        } finally {
            actionPending = false;
        }
    };

    const removeAddress = async (id: string) => {
        const target = addresses.find((item) => item.id === id);
        if (!target) return;

        actionPending = true;
        error = "";
        try {
            const remaining = addresses.filter((item) => item.id !== id);
            if (target.isDefault && remaining.length > 0) {
                const nextDefault = remaining[0];
                await setDefaultCustomerAddress(
                    nextDefault.id,
                    savedAddressToFormInput(nextDefault, true),
                );
            }

            await deleteCustomerAddress(id);
            await loadAddresses();
            notifyAccountUpdated();
        } catch (e) {
            if (e instanceof CustomerAuthError) {
                await redirectToLoginIfUnauthenticated();
                return;
            }
            error =
                e instanceof Error ? e.message : "Failed to remove address.";
        } finally {
            actionPending = false;
        }
    };

    const setDefault = async (id: string) => {
        const entry = addresses.find((item) => item.id === id);
        if (!entry) return;

        actionPending = true;
        error = "";
        try {
            await setDefaultCustomerAddress(
                id,
                savedAddressToFormInput(entry, true),
            );
            await loadAddresses();
            notifyAccountUpdated();
        } catch (e) {
            if (e instanceof CustomerAuthError) {
                await redirectToLoginIfUnauthenticated();
                return;
            }
            error =
                e instanceof Error
                    ? e.message
                    : "Failed to set default address.";
        } finally {
            actionPending = false;
        }
    };
</script>

<svelte:head>
    <title>My Addresses - Denimai</title>
</svelte:head>

<section class="account-panel-inner">
    <header class="account-panel-header">
        <h2 class="account-panel-heading">My Addresses</h2>
    </header>

    <div class="account-panel-toolbar">
        <h3 class="account-panel-subtitle">All Addresses</h3>
        <button
            type="button"
            class="account-add-link"
            onclick={openAddModal}
            disabled={loading || actionPending}>Add New Address</button
        >
    </div>

    <div class="account-panel-body">
        {#if loading}
            <p class="account-empty">Loading addresses…</p>
        {:else if error}
            <p class="account-empty">{error}</p>
        {:else if addresses.length === 0}
            <p class="account-empty">No saved addresses yet.</p>
        {:else}
            <ul class="account-address-list">
                {#each addresses as entry (entry.id)}
                    <li
                        class="account-address-card"
                        class:account-address-card--selected={entry.isDefault}
                    >
                        <div class="account-address-copy">
                            <div class="account-address-title-row">
                                <strong>{entry.name}</strong>
                                {#if entry.isDefault}
                                    <span class="account-address-badge"
                                        >Default</span
                                    >
                                {/if}
                            </div>
                            <span>{entry.line1}</span>
                            {#if entry.line2}
                                <span>{entry.line2}</span>
                            {/if}
                            <span>{formatCityStatePostal(entry)}</span>
                            <span>India</span>
                            {#if entry.phone}
                                <span class="account-address-phone"
                                    >Phone number: {entry.phone}</span
                                >
                            {/if}
                        </div>
                        <div class="account-address-actions">
                            {#if !entry.isDefault}
                                <button
                                    type="button"
                                    class="account-text-link"
                                    disabled={actionPending}
                                    onclick={() => void setDefault(entry.id)}
                                >
                                    Set as Default
                                </button>
                                <span class="account-action-sep">|</span>
                            {/if}
                            <button
                                type="button"
                                class="account-text-link"
                                disabled={actionPending}
                                onclick={() => openEditModal(entry)}
                                >Edit</button
                            >
                            <span class="account-action-sep">|</span>
                            <button
                                type="button"
                                class="account-text-link"
                                disabled={actionPending}
                                onclick={() => void removeAddress(entry.id)}
                                >Remove</button
                            >
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</section>

<AddAddressModal
    open={addressModalOpen}
    title={modalTitle}
    seed={editingId ?? "new"}
    initial={modalInitial}
    saving={actionPending}
    onClose={closeModal}
    onSave={(values) => void saveAddress(values)}
/>
