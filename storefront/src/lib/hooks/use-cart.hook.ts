import { get, writable } from "svelte/store";
import { client } from "$lib/api/client";
import { createMutation, createQuery } from "@tanstack/svelte-query";

export type Cart = NonNullable<
  Awaited<
    ReturnType<ReturnType<(typeof client)["admin"]["carts"]>["get"]>
  >["data"]
>;

export type CartLineItem = Cart["line_items"][number];
export type CartShippingAddress = Cart["shipping_address"];

const SESSION_STORAGE_KEY = "dm_sf_session_id";
const CART_STORAGE_KEY = "dm_sf_cart_id";
const DEFAULT_CART_CURRENCY_CODE = "usd";
const userCartStore = writable<Cart | null>(null);

export function setUserCart(cart: Cart | null) {
  userCartStore.set(cart);
}
export function getUserCart() {
  return get(userCartStore);
}
function getCartId(): string | null {
  if (typeof window === "undefined") {
    return getUserCart()?.id ?? null;
  }
  return getUserCart()?.id ?? localStorage.getItem(CART_STORAGE_KEY) ?? null;
}
export const saveInLocalStorage = (cart: Cart) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, cart?.id ?? "undefined");
};

export const openCart = () => {
  userCartStore.set(null);
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
};

export const closeCart = () => {
  userCartStore.set(null);
};
export const isCartOpen = () => {
  return get(userCartStore) !== null;
};

function normalizeLineItemPayload(item: Record<string, unknown>) {
  return {
    id: (item.id as string | undefined) ?? undefined,
    title: (item.title as string | null | undefined) ?? undefined,
    description: (item.description as string | null | undefined) ?? undefined,
    thumbnail: (item.thumbnail as string | null | undefined) ?? undefined,
    variant_id: (item.variant_id as string | null | undefined) ?? undefined,
    product_id: (item.product_id as string | null | undefined) ?? undefined,
    quantity: (item.quantity as number | null | undefined) ?? undefined,
    unit_price: (item.unit_price as string | null | undefined) ?? undefined,
  };
}

async function ensureSessionId(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Session storage is only available in the browser");
  }
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const res = await client.admin.auth.sessions.post({});
  if (res.error) throw new Error(res.error.value?.message ?? "Unknown error");
  const session = res.data as { id: string };
  localStorage.setItem(SESSION_STORAGE_KEY, session.id);
  return session.id;
}

export async function ensureCartId(): Promise<string> {
  const contextCartId = getUserCart()?.id;
  if (contextCartId) return contextCartId;

  const localCartId =
    typeof window !== "undefined"
      ? localStorage.getItem(CART_STORAGE_KEY)
      : null;
  if (localCartId) {
    const res = await client.admin.carts({ id: localCartId }).get();
    if (!res.error && res.data) {
      const cart = res.data as Cart;
      if (cart.completed_at == null) {
        setUserCart(cart);
        return cart.id;
      }
    }
  }

  const sessionId = await ensureSessionId();
  const created = await client.admin.carts.post({
    session_id: sessionId,
    currency_code: DEFAULT_CART_CURRENCY_CODE,
  });
  if (created.error)
    throw new Error(created.error.value?.message ?? "Unknown error");
  const cart = created.data as Cart;
  saveInLocalStorage(cart);
  setUserCart(cart);
  return cart.id;
}

export const useCart = () => {
  const updateCartLineItems = createMutation(() => ({
    mutationFn: async ({
      lineItems,
      id,
    }: {
      lineItems: Array<Partial<CartLineItem> & Record<string, unknown>>;
      id?: string;
    }) => {
      const cartId = id ?? getCartId() ?? (await ensureCartId());
      if (!cartId) return null;

      const res = await client.admin.carts({ id: cartId })["line-items"].put({
        line_items: lineItems.map((item) => normalizeLineItemPayload(item)),
      });
      if (res.error)
        throw new Error(res.error.value?.message ?? "Unknown error");
      setUserCart(res.data as Cart);
      return res.data;
    },
  }));

  const updateCartAddresses = createMutation(() => ({
    mutationFn: async ({ id, addresses }: { id: string; addresses: any[] }) => {
      const res = await client.admin.carts({ id }).addresses.put({
        shipping_address: {
          ...addresses[0],
          id: addresses[0]?.id ?? undefined,
        },
      });
      if (res.error)
        throw new Error(res.error.value?.message ?? "Unknown error");
      return res.data;
    },
  }));

  // const updateCartTaxLines = createMutation(() => ({
  //   mutationFn: async ({ id, taxLines }: { id: string; taxLines: any[] }) => {
  //     const res = await client.admin
  //       .carts({ id })
  //       ["tax-lines"].put({ tax_lines: taxLines });
  //     if (res.error)
  //       throw new Error(
  //         res.error.value?.message ??
  //           res.error.value?.errors.join(", ") ??
  //           "Unknown error",
  //       );
  //     return res.data;
  //   },
  // }));

  // const updateCartShippingLines = createMutation(() => ({
  //   mutationFn: async ({
  //     id,
  //     shippingLines,
  //   }: {
  //     id: string;
  //     shippingLines: any[];
  //   }) => {
  //     const res = await client.admin
  //       .carts({ id })
  //       ["shipping-lines"].put({ shipping_lines: shippingLines });
  //     if (res.error)
  //       throw new Error(
  //         res.error.value?.message ??
  //           res.error.value?.errors.join(", ") ??
  //           "Unknown error",
  //       );
  //     return res.data;
  //   },
  // }));

  const openCart = createMutation(() => ({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const res = await client.admin.carts.post({
        session_id: sessionId,
      });
      if (res.error)
        throw new Error(res.error.value?.message ?? "Unknown error");
      setUserCart(res.data as Cart);
      return res.data as Cart;
    },
  }));
  const createCart = createMutation(() => ({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const res = await client.admin.carts.post({
        session_id: sessionId,
      });
      if (res.error)
        throw new Error(res.error.value?.message ?? "Unknown error");
      setUserCart(res.data as Cart);
      return res.data as Cart;
    },
  }));
  const refetchCart = createQuery(() => ({
    queryKey: ["cart"] as const,
    enabled: Boolean(getCartId()),
    queryFn: async () => {
      const cartId = getCartId();
      if (!cartId) return null;
      const res = await client.admin.carts({ id: cartId }).get();
      if (res.error)
        throw new Error(res.error.value?.message ?? "Unknown error");
      setUserCart(res.data as Cart);
      return res.data;
    },
  }));

  return {
    updateCartLineItems,
    updateCartAddresses,
    createCart,
    refetchCart,
    openCart,
  };
};
