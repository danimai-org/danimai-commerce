import { client } from "$lib/api/client";
import {
  cartState,
  ensureCartId,
  getUserCart,
  initCartState,
  syncLineItems,
  type Cart,
  type CartLineItem,
  type CartShippingAddress,
} from "$lib/cart/cart-state.svelte";

export type { Cart, CartLineItem, CartShippingAddress };

export const useCart = () => {
  return {
    updateCartLineItems: {
      mutateAsync: async ({
        lineItems,
        id,
      }: {
        lineItems: Array<Partial<CartLineItem> & Record<string, unknown>>;
        id?: string;
      }) => syncLineItems(lineItems, id),
    },
    updateCartAddresses: {
      mutateAsync: async ({ id, addresses }: { id: string; addresses: any[] }) => {
        const res = await client.admin.carts({ id }).addresses.put({
          shipping_address: {
            ...addresses[0],
            id: addresses[0]?.id ?? undefined,
          },
        });
        if (res.error) {
          throw new Error(res.error.value?.message ?? "Unknown error");
        }
        return res.data;
      },
    },
    refetchCart: {
      get data() {
        return cartState.cart;
      },
      refetch: () => initCartState(true),
    },
  };
};

export { cartState, ensureCartId, getUserCart, initCartState };
