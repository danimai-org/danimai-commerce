import { Elysia } from "elysia";
import { productRoutes } from "./products";
import { collectionRoutes } from "./collections";
import { productCategoryRoutes } from "./product-categories";
import { productTagRoutes } from "./product-tags";
import { productAttributeRoutes } from "./product-attributes";
import { productAttributeGroupRoutes } from "./product-attribute-groups";
import { productVariantRoutes } from "./product-variants";
import { salesChannelRoutes } from "./sales-channels";
import { currencyRoutes } from "./currencies";
import { regionRoutes } from "./regions";
import { taxRegionRoutes } from "./tax-regions";
import { storeRoutes } from "./stores";
import { userRoutes } from "./users";
import { roleRoutes } from "./roles";
import { permissionRoutes } from "./permissions";
import { authRoutes } from "./auth";
import { inviteRoutes } from "./invites";
import { customerRoutes } from "./customers";
import { customerGroupRoutes } from "./customer-groups";
import { inventoryRoutes } from "./inventory";
import { orderRoutes } from "./orders";
import { stockLocationRoutes } from "./stock-locations";
import { priceListRoutes } from "./price-lists";
import { uploadRoutes } from "./upload";
import { promotionRoutes } from "./promotions";
import { campaignRoutes } from "./campaigns";

export const routes = new Elysia()
    .group('/admin', (app) => {
        return app.use(uploadRoutes)
            .use(productRoutes)
            .use(collectionRoutes)
            .use(productCategoryRoutes)
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
            .use(stockLocationRoutes)
            .use(priceListRoutes)
            .use(promotionRoutes)
            .use(campaignRoutes)
    });
