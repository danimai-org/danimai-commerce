<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import {
        ACCOUNT_STORAGE_KEY,
        ACCOUNT_UPDATED_EVENT,
        logoutCustomerSession,
        notifyAccountUpdated,
        parseStoredAccount,
        type StoredAccount,
    } from "$lib/account/storage";

    let { children } = $props();

    const defaultAccount: StoredAccount = {
        name: "Customer",
        email: "guest@denimai.com",
    };

    let account = $state<StoredAccount>(defaultAccount);

    const accountInitials = (name: string): string => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase() || "DM";
    };

    const firstName = (name: string): string =>
        name.trim().split(/\s+/)[0] || name;

    const syncAccount = () => {
        const name = $page.url.searchParams.get("name")?.trim();
        const email = $page.url.searchParams.get("email")?.trim();
        const stored = browser
            ? parseStoredAccount(localStorage.getItem(ACCOUNT_STORAGE_KEY))
            : null;
        account = {
            name: name || stored?.name || defaultAccount.name,
            email: email || stored?.email || defaultAccount.email,
        };
    };

    $effect(() => {
        $page.url.searchParams.get("name");
        $page.url.searchParams.get("email");
        syncAccount();
        if (!browser) return;
        const onAccountUpdated = () => syncAccount();
        window.addEventListener(ACCOUNT_UPDATED_EVENT, onAccountUpdated);
        return () =>
            window.removeEventListener(ACCOUNT_UPDATED_EVENT, onAccountUpdated);
    });

    const isActivePath = (href: string): boolean => {
        const path = $page.url.pathname;
        if (href === "/account/orders") {
            return path === "/account/orders" || path.startsWith("/account/order/");
        }
        return path === href || path.startsWith(`${href}/`);
    };

    const logout = async () => {
        if (!browser) return;
        await logoutCustomerSession();
        localStorage.removeItem(ACCOUNT_STORAGE_KEY);
        notifyAccountUpdated();
        await goto("/login");
    };
</script>

<svelte:head>
    <title>My Account - Denimai</title>
</svelte:head>

<div class="page-account">
    <SiteHeader />

    <main class="account-shell">
        <div class="account-grid">
            <aside class="account-sidebar" aria-label="Account navigation">
                <div class="account-profile">
                    <div class="account-avatar" aria-hidden="true">
                        {accountInitials(account.name)}
                    </div>
                    <div class="account-profile-copy">
                        <p class="account-greeting">
                            Hello, {firstName(account.name)}
                            <button
                                type="button"
                                class="account-edit-name"
                                aria-label="Edit name"
                                disabled
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    aria-hidden="true"
                                >
                                    <path d="M12 20h9" /><path
                                        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                                    />
                                </svg>
                            </button>
                        </p>
                        <p class="account-email">{account.email}</p>
                    </div>
                </div>

                <nav class="account-nav">
                    <div class="account-nav-group">
                        <p class="account-nav-label">Shopping</p>
                        <a
                            href="/account/orders"
                            class="account-nav-item"
                            class:account-nav-item--active={isActivePath(
                                "/account/orders",
                            )}
                        >
                            <span class="account-nav-icon" aria-hidden="true">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.75"
                                >
                                    <path
                                        d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
                                    /><path d="M3 6h18" /><path
                                        d="M16 10a4 4 0 0 1-8 0"
                                    />
                                </svg>
                            </span>
                            <span>My Orders</span>
                            <svg
                                class="account-nav-chevron"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </a>
                    </div>

                    <div class="account-nav-group">
                        <p class="account-nav-label">Account</p>
                        <a
                            href="/account"
                            class="account-nav-item"
                            class:account-nav-item--active={isActivePath("/account") &&
                                $page.url.pathname === "/account"}
                        >
                            <span class="account-nav-icon" aria-hidden="true">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.75"
                                >
                                    <path
                                        d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
                                    /><circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <span>My Account</span>
                            <svg
                                class="account-nav-chevron"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </a>
                        <a
                            href="/account/addresses"
                            class="account-nav-item"
                            class:account-nav-item--active={isActivePath(
                                "/account/addresses",
                            )}
                        >
                            <span class="account-nav-icon" aria-hidden="true">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.75"
                                >
                                    <path
                                        d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
                                    /><circle cx="12" cy="10" r="3" />
                                </svg>
                            </span>
                            <span>My Addresses</span>
                            <svg
                                class="account-nav-chevron"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </a>
                        <a
                            href="/account/wishlist"
                            class="account-nav-item"
                            class:account-nav-item--active={isActivePath(
                                "/account/wishlist",
                            )}
                        >
                            <span class="account-nav-icon" aria-hidden="true">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.75"
                                >
                                    <path
                                        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                                    />
                                </svg>
                            </span>
                            <span>My Wishlist</span>
                            <svg
                                class="account-nav-chevron"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </a>
                        <a
                            href="/account/help"
                            class="account-nav-item"
                            class:account-nav-item--active={isActivePath("/account/help")}
                        >
                            <span class="account-nav-icon" aria-hidden="true">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.75"
                                >
                                    <circle cx="12" cy="12" r="10" /><path
                                        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                                    /><path d="M12 17h.01" />
                                </svg>
                            </span>
                            <span>Need help</span>
                            <svg
                                class="account-nav-chevron"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </a>
                    </div>
                </nav>

                <div class="account-sidebar-footer">
                    <a href="/about" class="account-footer-link">FAQs</a>
                    <a href="/about" class="account-footer-link"
                        >Privacy Policy</a
                    >
                    <a href="/about" class="account-footer-link">Terms of Use</a
                    >
                    <button
                        type="button"
                        class="account-logout"
                        onclick={() => void logout()}>Logout</button
                    >
                </div>
            </aside>

            <div class="account-panel">
                {@render children()}
            </div>
        </div>
    </main>

    <SiteFooter />
</div>
