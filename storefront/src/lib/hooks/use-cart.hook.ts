import { getContext, setContext } from "svelte";
import { client } from "$lib/api/client";
import { createMutation, createQuery } from "@tanstack/svelte-query";
import { writable } from "svelte/store";

export type Cart = NonNullable<Awaited<
  ReturnType<ReturnType<(typeof client)["admin"]["carts"]>["get"]>
>["data"]>;


export type CartLineItem = Cart["line_items"][number];
export type CartShippingAddress = Cart["shipping_address"];

const USER_CART = Symbol("user_cart");

export function setUserCart(cart: Cart) {
  setContext(USER_CART, cart);
}
export function getUserCart() {
  return getContext<Cart>(USER_CART);
}
function getCartId(): string | null {
  return getUserCart()?.id ?? null;
}
export const saveInLocalStorage = (cart: Cart) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("dm_sf_cart_id", cart?.id ?? "undefined");
};

export const openCart = () => {
  setContext(USER_CART, null);
  localStorage.removeItem("dm_sf_cart_id");
};

export const closeCart = () => {
  setContext(USER_CART, null);
};
export const isCartOpen = () => {
  return getContext<Cart>(USER_CART) !== null;
};

export const useCart = () => {
  const updateCartLineItems = createMutation(() => ({
    mutationFn: async ({ lineItems }: { lineItems: CartLineItem[] }) => {
      const cartId = getCartId();
      if (!cartId) return null;

      const res = await client.admin
        .carts({ id: cartId })
      ["line-items"].put({
        line_items: lineItems.map(item => ({

        }))
      });
      if (res.error)
        throw new Error(res.error.value?.message ?? "Unknown error");
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
