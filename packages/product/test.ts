import Medusa, { Admin } from "@medusajs/js-sdk";
import { CreateProductDTO } from "@medusajs/types";

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",

  auth: {
    type: "session",
  },
});

sdk.store.product.list().then((res) => console.log(res.products[0].));