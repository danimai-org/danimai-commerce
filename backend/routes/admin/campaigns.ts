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
import {
  campaignsStore,
  paginateRows,
  promotionsStore,
} from "./promotions-store";

const CampaignSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  identifier: Type.String(),
  start_date: Type.Union([Type.String(), Type.Null()]),
  end_date: Type.Union([Type.String(), Type.Null()]),
});

const PaginatedCampaignsResponseSchema =
  createPaginatedResponseSchema(CampaignSchema);

const CreateCampaignSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  identifier: Type.Optional(Type.String()),
  start_date: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  end_date: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const UpdateCampaignSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  identifier: Type.Optional(Type.String()),
  start_date: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  end_date: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const DeleteCampaignsSchema = Type.Object({
  campaign_ids: Type.Array(Type.String(), { minItems: 1 }),
});

export const campaignRoutes = new Elysia({ prefix: "/campaigns" })
  .get(
    "/",
    async ({ query }) => {
      const input = query as PaginationType;
      const search = (input.search ?? "").toLowerCase();
      const filtered = search
        ? campaignsStore.filter(
            (campaign) =>
              campaign.name.toLowerCase().includes(search) ||
              campaign.identifier.toLowerCase().includes(search) ||
              (campaign.description ?? "").toLowerCase().includes(search)
          )
        : campaignsStore;

      return paginateRows(filtered, input.page, input.limit);
    },
    {
      query: PaginationSchema,
      response: {
        200: PaginatedCampaignsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Campaigns"],
        summary: "Get paginated campaigns",
        description: "Gets a paginated list of campaigns",
      },
    }
  )
  .post(
    "/",
    async ({ body }) => {
      const input = body as {
        name: string;
        description?: string | null;
        identifier?: string;
        start_date?: string | null;
        end_date?: string | null;
      };

      const created = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        description: input.description ?? null,
        identifier:
          input.identifier?.trim() ||
          input.name.trim().toUpperCase().replace(/\s+/g, "_"),
        start_date: input.start_date ?? null,
        end_date: input.end_date ?? null,
      };

      campaignsStore.unshift(created);
      return created;
    },
    {
      body: CreateCampaignSchema,
      response: {
        200: CampaignSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Campaigns"],
        summary: "Create a campaign",
        description: "Creates a single campaign",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const idx = campaignsStore.findIndex((campaign) => campaign.id === params.id);
      if (idx === -1) {
        set.status = 404;
        return { error: "NotFound", message: "Campaign not found" } as const;
      }

      const input = body as {
        name?: string;
        description?: string | null;
        identifier?: string;
        start_date?: string | null;
        end_date?: string | null;
      };
      const current = campaignsStore[idx];
      const updated = {
        ...current,
        name: input.name?.trim() ?? current.name,
        description: input.description ?? current.description,
        identifier: input.identifier?.trim() ?? current.identifier,
        start_date: input.start_date ?? current.start_date,
        end_date: input.end_date ?? current.end_date,
      };
      campaignsStore[idx] = updated;
      return updated;
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateCampaignSchema,
      response: {
        200: CampaignSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Campaigns"],
        summary: "Update a campaign",
        description: "Updates a campaign by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body, set }) => {
      const { campaign_ids } = body as { campaign_ids: string[] };
      const ids = new Set(campaign_ids);

      for (let i = campaignsStore.length - 1; i >= 0; i -= 1) {
        if (ids.has(campaignsStore[i].id)) {
          campaignsStore.splice(i, 1);
        }
      }

      for (const promotion of promotionsStore) {
        if (promotion.campaign_id != null && ids.has(promotion.campaign_id)) {
          promotion.campaign_id = null;
        }
      }

      set.status = 204;
      return undefined;
    },
    {
      body: DeleteCampaignsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Campaigns"],
        summary: "Delete campaigns",
        description: "Deletes campaigns by IDs",
      },
    }
  );
