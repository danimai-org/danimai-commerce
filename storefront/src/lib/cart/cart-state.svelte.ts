import { client } from "$lib/api/client";

export type Cart = NonNullable<
  Awaited<ReturnType<ReturnType<(typeof client)["admin"]["carts"]>["get"]>>["data"]
>;

export type CartLineItem = Cart["line_items"][number];
export type CartShippingAddress = Cart["shipping_address"];

type LineItemPayload = Partial<CartLineItem> & Record<string, unknown>;

const SESSION_STORAGE_KEY = "dm_sf_session_id";
const CART_STORAGE_KEY = "dm_sf_cart_id";
const DEFAULT_CART_CURRENCY_CODE = "eur";

export const cartState = $state({
  cart: null as Cart | null,
  loading: false,
  error: null as string | null,
  initialized: false,
  sheetOpen: false,
});

let initPromise: Promise<Cart | null> | null = null;

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

function setCartId(cartId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, cartId);
}

function getLocalCartId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_STORAGE_KEY);
}

function clearCartId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
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

async function createCartRow(sessionId: string): Promise<Cart> {
  const created = await client.admin.carts.post({
    session_id: sessionId,
    currency_code: DEFAULT_CART_CURRENCY_CODE,
  });
  if (created.error) {
    throw new Error(created.error.value?.message ?? "Unknown error");
  }
  const cart = created.data as Cart;
  setCartId(cart.id);
  return cart;
}

async function retrieveCart(cartId: string): Promise<Cart | null> {
  const res = await client.admin.carts({ id: cartId }).get();
  if (res.error || !res.data) return null;
  return res.data as Cart;
}

export async function initCartState(force = false): Promise<Cart | null> {
  if (typeof window === "undefined") return null;
  if (cartState.initialized && !force) return cartState.cart;
  if (initPromise && !force) return initPromise;

  initPromise = (async () => {
    cartState.loading = true;
    cartState.error = null;
    try {
      const sessionId = await ensureSessionId();
      let cart: Cart | null = null;
      const localCartId = getLocalCartId();

      if (localCartId) {
        cart = await retrieveCart(localCartId);
      }

      if (!cart || cart.completed_at != null) {
        clearCartId();
        cart = await createCartRow(sessionId);
        cart = await retrieveCart(cart.id);
      }

      cartState.cart = cart;
      cartState.initialized = true;
      return cart;
    } catch (error) {
      cartState.error = error instanceof Error ? error.message : "Unknown error";
      throw error;
    } finally {
      cartState.loading = false;
      initPromise = null;
    }
  })();

  return initPromise;
}

export function getUserCart() {
  return cartState.cart;
}

export async function ensureCartId(): Promise<string> {
  const current = cartState.cart?.id;
  if (current) return current;
  const cart = await initCartState();
  if (!cart?.id) throw new Error("Failed to initialize cart");
  return cart.id;
}

export async function syncLineItems(
  lineItems: Array<LineItemPayload>,
  id?: string,
): Promise<Cart> {
  const cartId = id ?? (await ensureCartId());
  const res = await client.admin.carts({ id: cartId })["line-items"].put({
    line_items: lineItems.map((item) => normalizeLineItemPayload(item)),
  });
  if (res.error || !res.data) {
    throw new Error(res.error?.value?.message ?? "Unknown error");
  }
  const cart = res.data as Cart;
  cartState.cart = cart;
  setCartId(cart.id);
  return cart;
}

export async function applyPromoCode(code: string, id?: string): Promise<Cart> {
  const cartId = id ?? (await ensureCartId());
  const res = await client.admin.carts({ id: cartId })["promo-code"].put({
    code,
  });
  if (res.error || !res.data) {
    throw new Error(res.error?.value?.message ?? "Unknown error");
  }
  const cart = res.data as Cart;
  cartState.cart = cart;
  setCartId(cart.id);
  return cart;
}

export async function addItem(input: {
  variantId: string;
  quantity?: number;
  thumbnail?: string | null;
  title?: string | null;
  description?: string | null;
  productId?: string | null;
  unitPrice?: string | null;
}) {
  const cart = (await initCartState()) ?? (await retrieveCart(await ensureCartId()));
  if (!cart) throw new Error("Cart is not available");

  const quantity = Math.max(1, input.quantity ?? 1);
  const existing = cart.line_items.find((li) => li.variant_id === input.variantId);
  const next = existing
    ? cart.line_items.map((li) =>
        li.id === existing.id
          ? { ...li, quantity: (li.quantity ?? 0) + quantity }
          : li,
      )
    : [
        ...cart.line_items,
        {
          variant_id: input.variantId,
          quantity,
          thumbnail: input.thumbnail ?? null,
          title: input.title ?? null,
          description: input.description?.trim() || null,
          product_id: input.productId ?? null,
          unit_price: input.unitPrice ?? null,
        } as Record<string, unknown>,
      ];

  return syncLineItems(next as Array<LineItemPayload>, cart.id);
}

export type AddItemInput = Parameters<typeof addItem>[0];

export async function addItemAndOpenSheet(input: AddItemInput) {
  const cart = await addItem(input);
  openCartSheet();
  return cart;
}

export async function removeItem(variantId: string) {
  const cart = (await initCartState()) ?? null;
  if (!cart) return null;
  const next = cart.line_items.filter((li) => li.variant_id !== variantId);
  return syncLineItems(next as Array<LineItemPayload>, cart.id);
}

export async function removeLineItem(lineId: string) {
  const cart = (await initCartState()) ?? null;
  if (!cart) return null;
  const next = cart.line_items.filter((li) => li.id !== lineId);
  return syncLineItems(next as Array<LineItemPayload>, cart.id);
}

export async function changeQuantity(variantId: string, quantity: number) {
  const cart = (await initCartState()) ?? null;
  if (!cart) return null;
  const normalized = Math.max(0, quantity);
  const next = cart.line_items
    .map((li) => (li.variant_id === variantId ? { ...li, quantity: normalized } : li))
    .filter((li) => (li.quantity ?? 0) > 0);
  return syncLineItems(next as Array<LineItemPayload>, cart.id);
}

export async function changeLineItemQuantity(lineId: string, quantity: number) {
  const cart = (await initCartState()) ?? null;
  if (!cart) return null;
  const normalized = Math.max(0, quantity);
  const next = cart.line_items
    .map((li) => (li.id === lineId ? { ...li, quantity: normalized } : li))
    .filter((li) => (li.quantity ?? 0) > 0);
  return syncLineItems(next as Array<LineItemPayload>, cart.id);
}

export function openCartSheet() {
  cartState.sheetOpen = true;
}

export function closeCartSheet() {
  cartState.sheetOpen = false;
}

export function toggleCartSheet() {
  cartState.sheetOpen = !cartState.sheetOpen;
}
