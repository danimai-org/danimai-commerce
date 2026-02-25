import { Elysia } from "elysia";
import { productRoutes } from "./admin/products";
import { collectionRoutes } from "./admin/collections";
import { productCategoryRoutes } from "./admin/product-categories";
import { productOptionRoutes } from "./admin/product-options";
import { productTagRoutes } from "./admin/product-tags";
import { productAttributeRoutes } from "./admin/product-attributes";
import { productAttributeGroupRoutes } from "./admin/product-attribute-groups";
import { productVariantRoutes } from "./admin/product-variants";
import { salesChannelRoutes } from "./admin/sales-channels";
import { currencyRoutes } from "./admin/currencies";
import { regionRoutes } from "./admin/regions";
import { taxRegionRoutes } from "./admin/tax-regions";
import { storeRoutes } from "./admin/stores";
import { userRoutes } from "./admin/users";
import { roleRoutes } from "./admin/roles";
import { permissionRoutes } from "./admin/permissions";
import { authRoutes } from "./admin/auth";
import { inviteRoutes } from "./admin/invites";
import { customerRoutes } from "./admin/customers";
import { customerGroupRoutes } from "./admin/customer-groups";
import { inventoryRoutes } from "./admin/inventory";
import { orderRoutes } from "./admin/orders";
import { stockLocationRoutes } from "./admin/stock-locations";
import { uploadRoutes } from "./admin/upload";

export const routes = new Elysia()
  .use(uploadRoutes)
  .use(productRoutes)
  .use(collectionRoutes)
  .use(productCategoryRoutes)
  .use(productOptionRoutes)
  .use(productTagRoutes)
  .use(productAttributeRoutes)
  .use(productAttributeGroupRoutes)
  .use(productVariantRoutes)
  .use(salesChannelRoutes)
  .use(currencyRoutes)
  .use(regionRoutes)
  .use(taxRegionRoutes)
  .use(storeRoutes)
  .use(userRoutes)
  .use(roleRoutes)
  .use(permissionRoutes)
  .use(authRoutes)
  .use(inviteRoutes)
  .use(customerRoutes)
  .use(customerGroupRoutes)
  .use(inventoryRoutes)
  .use(orderRoutes)
  .use(stockLocationRoutes);
