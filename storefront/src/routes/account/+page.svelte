<script lang="ts">
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import {
        ACCOUNT_STORAGE_KEY,
        notifyAccountUpdated,
        parseStoredAccount,
    } from "$lib/account/storage";

    const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

    let fullName = $state("");
    let email = $state("");
    let phone = $state("");
    let dateOfBirth = $state("");
    let gender = $state("");
    let saved = $state(false);

    const loadProfile = () => {
        if (!browser) return;
        const fromUrlName = $page.url.searchParams.get("name")?.trim();
        const fromUrlEmail = $page.url.searchParams.get("email")?.trim();
        const stored = parseStoredAccount(
            localStorage.getItem(ACCOUNT_STORAGE_KEY),
        );

        fullName = fromUrlName || stored?.name || "";
        email = fromUrlEmail || stored?.email || "";
        phone = stored?.phone ?? "";
        dateOfBirth = stored?.dateOfBirth ?? "";
        gender = stored?.gender ?? "";
    };

    $effect(() => {
        $page.url.searchParams.get("name");
        $page.url.searchParams.get("email");
        loadProfile();
    });

    const saveProfile = (event: SubmitEvent) => {
        event.preventDefault();
        if (!browser) return;

        const name = fullName.trim();
        const emailValue = email.trim();
        if (!name || !emailValue) return;

        const existing = parseStoredAccount(
            localStorage.getItem(ACCOUNT_STORAGE_KEY),
        );
        localStorage.setItem(
            ACCOUNT_STORAGE_KEY,
            JSON.stringify({
                ...existing,
                name,
                email: emailValue,
                phone: phone.trim(),
                dateOfBirth: dateOfBirth.trim(),
                gender: gender.trim(),
            }),
        );

        notifyAccountUpdated();
        saved = true;
        setTimeout(() => {
            saved = false;
        }, 2500);
    };
</script>

<svelte:head>
    <title>My Account - Denimai</title>
</svelte:head>

<section class="account-panel-inner">
    <header class="account-panel-header">
        <h2 class="account-panel-heading">My Account</h2>
    </header>

    <form class="account-profile-form" onsubmit={saveProfile}>
        <label class="account-profile-field account-profile-field--full">
            <span class="account-profile-label">Full Name</span>
            <input
                bind:value={fullName}
                type="text"
                autocomplete="name"
                required
            />
        </label>

        <div class="account-profile-row">
            <label class="account-profile-field">
                <span class="account-profile-label">Email</span>
                <input
                    bind:value={email}
                    type="email"
                    autocomplete="email"
                    required
                />
            </label>
            <label class="account-profile-field account-profile-field--phone">
                <span class="account-profile-label">Phone number</span>
                <span class="account-profile-phone">
                    <span
                        class="account-profile-phone-prefix"
                        aria-hidden="true">+91</span
                    >
                    <input
                        bind:value={phone}
                        type="tel"
                        placeholder="Enter phone number"
                        autocomplete="tel-national"
                        inputmode="tel"
                    />
                </span>
            </label>
        </div>

        <div class="account-profile-row">
            <label class="account-profile-field">
                <span class="account-profile-label">Date Of Birth</span>
                <input
                    bind:value={dateOfBirth}
                    type="text"
                    placeholder="DD/MM/YYYY"
                    autocomplete="bday"
                />
            </label>
            <label class="account-profile-field account-profile-field--select">
                <span class="account-profile-label">Gender</span>
                <select bind:value={gender}>
                    <option value="">Gender</option>
                    {#each GENDER_OPTIONS as option}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
                <svg
                    class="account-profile-chevron"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </label>
        </div>

        <a href="/login" class="account-profile-password-link"
            >Change Password</a
        >

        <div class="account-profile-actions">
            {#if saved}
                <p class="account-profile-saved" role="status">
                    Changes saved.
                </p>
            {/if}
            <button type="submit" class="account-profile-save"
                >Save Changes</button
            >
        </div>
    </form>
</section>
