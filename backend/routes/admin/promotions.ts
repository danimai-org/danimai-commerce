import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import {
  PaginationSchema,
  createPaginatedResponseSchema,
  type PaginationType,
} from "@danimai/core/pagination";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
  NotFoundResponseSchema,
} from "../../utils/response-schemas";
import { campaignsStore, paginateRows, promotionsStore } from "./promotions-store";

const PromotionSchema = Type.Object({
  id: Type.String(),
  code: Type.String(),
  method: Type.Union([Type.Literal("Automatic"), Type.Literal("Manual")]),
  status: Type.Union([
    Type.Literal("Active"),
    Type.Literal("Inactive"),
    Type.Literal("Draft"),
  ]),
  campaign_id: Type.Union([Type.String(), Type.Null()]),
  campaign_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const PaginatedPromotionsResponseSchema =
  createPaginatedResponseSchema(PromotionSchema);

const CreatePromotionSchema = Type.Object({
  code: Type.String(),
  method: Type.Union([Type.Literal("Automatic"), Type.Literal("Manual")]),
  status: Type.Union([
    Type.Literal("Active"),
    Type.Literal("Inactive"),
    Type.Literal("Draft"),
  ]),
  campaign_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const UpdatePromotionSchema = Type.Object({
  code: Type.Optional(Type.String()),
  method: Type.Optional(
    Type.Union([Type.Literal("Automatic"), Type.Literal("Manual")])
  ),
  status: Type.Optional(
    Type.Union([
      Type.Literal("Active"),
      Type.Literal("Inactive"),
      Type.Literal("Draft"),
    ])
  ),
  campaign_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const DeletePromotionsSchema = Type.Object({
  promotion_ids: Type.Array(Type.String(), { minItems: 1 }),
});

function withCampaignName(row: {
  id: string;
  code: string;
  method: "Automatic" | "Manual";
  status: "Active" | "Inactive" | "Draft";
  campaign_id: string | null;
}) {
  const campaign = campaignsStore.find((item) => item.id === row.campaign_id);
  return {
    ...row,
    campaign_name: campaign?.name ?? null,
  };
}

export const promotionRoutes = new Elysia({ prefix: "/promotions" })
  .get(
    "/",
    async ({ query }) => {
      const input = query as PaginationType;
      const search = (input.search ?? "").toLowerCase();

      const filtered = search
        ? promotionsStore.filter((promotion) =>
            promotion.code.toLowerCase().includes(search)
          )
        : promotionsStore;

      const rowsWithCampaign = filtered.map(withCampaignName);
      return paginateRows(rowsWithCampaign, input.page, input.limit);
    },
    {
      query: PaginationSchema,
      response: {
        200: PaginatedPromotionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Promotions"],
        summary: "Get paginated promotions",
        description: "Gets a paginated list of promotions",
      },
    }
  )
  .post(
    "/",
    async ({ body }) => {
      const input = body as {
        code: string;
        method: "Automatic" | "Manual";
        status: "Active" | "Inactive" | "Draft";
        campaign_id?: string | null;
      };

      const created = {
        id: crypto.randomUUID(),
        code: input.code.trim(),
        method: input.method,
        status: input.status,
        campaign_id: input.campaign_id ?? null,
      };

      promotionsStore.unshift(created);
      return withCampaignName(created);
    },
    {
      body: CreatePromotionSchema,
      response: {
        200: PromotionSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Promotions"],
        summary: "Create a promotion",
        description: "Creates a single promotion",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const idx = promotionsStore.findIndex(
        (promotion) => promotion.id === params.id
      );
      if (idx === -1) {
        set.status = 404;
        return { error: "NotFound", message: "Promotion not found" } as const;
      }

      const input = body as {
        code?: string;
        method?: "Automatic" | "Manual";
        status?: "Active" | "Inactive" | "Draft";
        campaign_id?: string | null;
      };
      const current = promotionsStore[idx];
      const updated = {
        ...current,
        code: input.code?.trim() ?? current.code,
        method: input.method ?? current.method,
        status: input.status ?? current.status,
        campaign_id:
          input.campaign_id !== undefined
            ? input.campaign_id
            : current.campaign_id,
      };
      promotionsStore[idx] = updated;

      return withCampaignName(updated);
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdatePromotionSchema,
      response: {
        200: PromotionSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Promotions"],
        summary: "Update a promotion",
        description: "Updates a promotion by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body, set }) => {
      const { promotion_ids } = body as { promotion_ids: string[] };
      const ids = new Set(promotion_ids);

      for (let i = promotionsStore.length - 1; i >= 0; i -= 1) {
        if (ids.has(promotionsStore[i].id)) {
          promotionsStore.splice(i, 1);
        }
      }

      set.status = 204;
      return undefined;
    },
    {
      body: DeletePromotionsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Promotions"],
        summary: "Delete promotions",
        description: "Deletes promotions by IDs",
      },
    }
  );
