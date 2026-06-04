import type { CheckoutFormData } from "$lib/checkout/checkout-form-schema";
import type { Cart } from "$lib/types/cart";

const DRAFT_KEY_PREFIX = "dm_sf_checkout_draft_";

export type CheckoutDraft = Partial<CheckoutFormData>;

function draftKey(cartId: string): string {
    return `${DRAFT_KEY_PREFIX}${cartId.trim()}`;
}

export function loadCheckoutDraft(cartId: string): CheckoutDraft | null {
    if (typeof window === "undefined") return null;
    const id = cartId.trim();
    if (!id) return null;
    try {
        const raw = sessionStorage.getItem(draftKey(id));
        if (!raw) return null;
        return JSON.parse(raw) as CheckoutDraft;
    } catch {
        return null;
    }
}

export function saveCheckoutDraft(cartId: string, data: CheckoutDraft): void {
    if (typeof window === "undefined") return;
    const id = cartId.trim();
    if (!id) return;
    try {
        sessionStorage.setItem(draftKey(id), JSON.stringify(data));
    } catch {
        // sessionStorage full or unavailable
    }
}

export function clearCheckoutDraft(cartId: string): void {
    if (typeof window === "undefined") return;
    const id = cartId.trim();
    if (!id) return;
    sessionStorage.removeItem(draftKey(id));
}

export function checkoutFormFromCartShipping(cart: Cart | null): CheckoutDraft | null {
    const addr = cart?.shipping_address;
    if (!addr) return null;

    const meta =
        typeof addr.metadata === "object" && addr.metadata !== null
            ? (addr.metadata as Record<string, unknown>)
            : {};

    const firstName = String(meta.first_name ?? "").trim();
    const lastName = String(meta.last_name ?? "").trim();
    const email = String(meta.email ?? "").trim();

    const patch: CheckoutDraft = {
        address1: addr.address_1?.trim() || undefined,
        address2: addr.address_2?.trim() || undefined,
        company: addr.company?.trim() || undefined,
        city: addr.city?.trim() || undefined,
        state: addr.province?.trim() || undefined,
        postalCode: addr.postal_code?.trim() || undefined,
        country: addr.country_code?.trim() || undefined,
        phone: addr.phone?.trim() || undefined,
    };

    if (firstName) patch.firstName = firstName;
    if (lastName) patch.lastName = lastName;
    if (email) patch.email = email;

    const hasData = Object.values(patch).some(
        (v) => v !== undefined && v !== "",
    );
    return hasData ? patch : null;
}
