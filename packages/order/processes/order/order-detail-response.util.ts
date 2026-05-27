import type { Order, OrderAddress } from "../../db/type";
import {
  formatAddressLines,
  readString,
  variantLabelFromSnapshot,
} from "./order-snapshot.util";

type OrderLineItemRow = {
  id: string;
  title: string;
  thumbnail: string | null;
  unit_price: string;
  quantity: number;
  variant_sku: string | null;
  variant_title: string | null;
  variant_option_values: unknown | null;
  product_title: string | null;
  product_handle: string | null;
  description: string | null;
};

export function buildOrderDetailMetadata(
  order: Order,
  lineItems: OrderLineItemRow[],
  shippingAddress: OrderAddress | null,
  billingAddress: OrderAddress | null,
): Record<string, unknown> {
  const meta =
    typeof order.metadata === "object" && order.metadata !== null
      ? (order.metadata as Record<string, unknown>)
      : {};

  const paymentMethod =
    readString(meta.payment_method) ?? readString(meta.paymentMethod) ?? "—";
  const shippingMethod =
    readString(meta.shipping_method) ??
    readString(meta.shippingMethod) ??
    "—";

  const subtotal = lineItems.reduce((sum, li) => {
    const unit = Number.parseFloat(li.unit_price) || 0;
    return sum + unit * li.quantity;
  }, 0);

  return {
    ...meta,
    payment_method: paymentMethod,
    shipping_method: shippingMethod,
    customer: {
      email: order.email ?? readString(meta.email) ?? "—",
      customer_id: order.customer_id,
    },
    shipping_address: shippingAddress
      ? {
          firstName: shippingAddress.first_name,
          lastName: shippingAddress.last_name,
          address1: shippingAddress.address_1,
          address2: shippingAddress.address_2,
          city: shippingAddress.city,
          state: shippingAddress.province,
          country: shippingAddress.country_code,
          postalCode: shippingAddress.postal_code,
          phone: shippingAddress.phone,
          lines: formatAddressLines(shippingAddress),
        }
      : null,
    billing_address: billingAddress
      ? {
          firstName: billingAddress.first_name,
          lastName: billingAddress.last_name,
          address1: billingAddress.address_1,
          address2: billingAddress.address_2,
          city: billingAddress.city,
          state: billingAddress.province,
          country: billingAddress.country_code,
          postalCode: billingAddress.postal_code,
          phone: billingAddress.phone,
          lines: formatAddressLines(billingAddress),
        }
      : null,
    items: lineItems.map((li) => {
      const snapshot = {
        productTitle: li.product_title,
        variantTitle: li.variant_title,
        variantSku: li.variant_sku,
        variantOptionValues: li.variant_option_values,
        productHandle: li.product_handle,
      };
      return {
        id: li.id,
        productId: null,
        productName: li.product_title ?? li.title,
        productImage: li.thumbnail,
        title: li.product_title ?? li.title,
        thumbnail: li.thumbnail,
        selectedVariant: li.variant_title,
        selectedOptions: li.variant_option_values,
        variant: variantLabelFromSnapshot(snapshot) || li.description,
        sku: li.variant_sku,
        price: Number.parseFloat(li.unit_price) || 0,
        quantity: li.quantity,
        currency: order.currency_code,
        productHandle: li.product_handle,
      };
    }),
    totals: {
      subtotal,
      shipping: 0,
      discount: 0,
      tax: 0,
      total: subtotal,
      currency_code: order.currency_code,
    },
  };
}
