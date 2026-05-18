import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_CART_PROCESS,
  APPLY_CART_PROMO_CODE_PROCESS,
  ApplyCartPromoCodeProcess,
  ApplyCartPromoCodeSchema,
  CreateCartProcess,
  CreateCartSchema,
  CreateCartResponseSchema,
  RETRIEVE_CART_PROCESS,
  RetrieveCartProcess,
  RetrieveCartSchema,
  RetrieveCartResponseSchema,
  UPDATE_CART_LINE_ITEMS_PROCESS,
  UpdateCartLineItemsProcess,
  UpdateCartLineItemsSchema,
  UPDATE_CART_ADDRESSES_PROCESS,
  UpdateCartAddressesProcess,
  UpdateCartAddressesSchema,
  UPDATE_CART_TAX_LINES_PROCESS,
  UpdateCartTaxLinesProcess,
  UpdateCartTaxLinesSchema,
} from "@danimai/cart";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateCartLineItemsBodySchema = Type.Omit(UpdateCartLineItemsSchema, ["id"]);
const UpdateCartAddressesBodySchema = Type.Omit(UpdateCartAddressesSchema, ["id"]);
const UpdateCartTaxLinesBodySchema = Type.Omit(UpdateCartTaxLinesSchema, ["id"]);
const ApplyCartPromoCodeBodySchema = Type.Omit(ApplyCartPromoCodeSchema, ["id"]);

export const storefrontCartRoutes = new Elysia({ prefix: "/carts" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/",
    async ({ body }: { body: StaticDecode<typeof CreateCartSchema> }) => {
      const process = getService<CreateCartProcess>(CREATE_CART_PROCESS);
      return process.runOperations({ input: body });
    },
    {
      body: CreateCartSchema,
      response: {
        200: CreateCartResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Carts"],
        summary: "Create cart",
        description: "Creates a new cart",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveCartProcess>(RETRIEVE_CART_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: RetrieveCartSchema.properties.id }),
      response: {
        200: RetrieveCartResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Carts"],
        summary: "Get cart by id",
        description: "Returns a cart with line items, tax lines, and shipping address",
      },
    }
  )
  .put(
    "/:id/line-items",
    async ({ params, body }) => {
      const process = getService<UpdateCartLineItemsProcess>(
        UPDATE_CART_LINE_ITEMS_PROCESS
      );
      return process.runOperations({
        input: {
          ...body,
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdateCartLineItemsSchema.properties.id }),
      body: UpdateCartLineItemsBodySchema,
      response: {
        200: RetrieveCartResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Carts"],
        summary: "Update cart line items",
        description: "Syncs line items for a cart",
      },
    }
  )
  .put(
    "/:id/promo-code",
    async ({ params, body }) => {
      const process = getService<ApplyCartPromoCodeProcess>(
        APPLY_CART_PROMO_CODE_PROCESS
      );
      return process.runOperations({
        input: {
          ...body,
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: ApplyCartPromoCodeSchema.properties.id }),
      body: ApplyCartPromoCodeBodySchema,
      response: {
        200: RetrieveCartResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Carts"],
        summary: "Apply promo code",
        description: "Validates and applies a promo code to cart line items",
      },
    }
  )
  .put(
    "/:id/addresses",
    async ({ params, body }) => {
      const process = getService<UpdateCartAddressesProcess>(
        UPDATE_CART_ADDRESSES_PROCESS
      );
      return process.runOperations({
        input: {
          ...body,
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdateCartAddressesSchema.properties.id }),
      body: UpdateCartAddressesBodySchema,
      response: {
        200: RetrieveCartResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Carts"],
        summary: "Update cart shipping address",
        description: "Creates or updates the shipping address for a cart",
      },
    }
  )
  .put(
    "/:id/tax-lines",
    async ({ params, body }) => {
      const process = getService<UpdateCartTaxLinesProcess>(
        UPDATE_CART_TAX_LINES_PROCESS
      );
      return process.runOperations({
        input: {
          ...body,
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdateCartTaxLinesSchema.properties.id }),
      body: UpdateCartTaxLinesBodySchema,
      response: {
        200: RetrieveCartResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Carts"],
        summary: "Update cart tax lines",
        description: "Syncs tax lines per line item for a cart",
      },
    }
  );
