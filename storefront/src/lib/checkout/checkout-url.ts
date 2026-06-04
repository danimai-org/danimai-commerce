export type CheckoutStep = "addresses" | "delivery" | "payment" | "review";

const STEP_QUERY_KEYS: Array<{ keys: string[]; step: CheckoutStep }> = [
    { keys: ["review", "Review"], step: "review" },
    { keys: ["payment", "Payment"], step: "payment" },
    { keys: ["delivery", "Delivery"], step: "delivery" },
    { keys: ["address", "addresses", "Address", "Addresses"], step: "addresses" },
];

const STEP_TO_QUERY_KEY: Record<CheckoutStep, string> = {
    addresses: "address",
    delivery: "delivery",
    payment: "payment",
    review: "review",
};

function normalizeLegacyStep(value: string): CheckoutStep | null {
    const key = value.trim().toLowerCase();
    if (key === "address" || key === "addresses") return "addresses";
    if (key === "delivery") return "delivery";
    if (key === "payment") return "payment";
    if (key === "review") return "review";
    return null;
}

export function hasCheckoutStepParam(searchParams: URLSearchParams): boolean {
    return (
        STEP_QUERY_KEYS.some((entry) =>
            entry.keys.some((key) => searchParams.has(key)),
        ) || searchParams.has("step")
    );
}

export function parseCheckoutStepFromSearchParams(
    searchParams: URLSearchParams,
): CheckoutStep {
    for (const entry of STEP_QUERY_KEYS) {
        if (entry.keys.some((key) => searchParams.has(key))) {
            return entry.step;
        }
    }
    const legacy = searchParams.get("step");
    if (legacy) {
        const parsed = normalizeLegacyStep(legacy);
        if (parsed) return parsed;
    }
    return "addresses";
}

export function checkoutStepSearchParams(step: CheckoutStep): URLSearchParams {
    return new URLSearchParams([[STEP_TO_QUERY_KEY[step], ""]]);
}

export function getCheckoutPath(step: CheckoutStep, cartId?: string | null): string {
    const base = cartId?.trim()
        ? `/cart/${encodeURIComponent(cartId.trim())}/checkout`
        : "/checkout";
    const query = checkoutStepSearchParams(step).toString();
    return query ? `${base}?${query}` : base;
}
