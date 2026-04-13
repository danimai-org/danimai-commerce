import { Elysia, t } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  DELETE_MEDIA_PROCESS,
  PAGINATED_MEDIA_PROCESS,
  UPLOAD_MEDIA_PROCESS,
  DeleteMediaProcess,
  PaginatedMediaResponseSchema,
  PaginatedMediaSchema,
  UploadMediaProcess,
} from "@danimai/media";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UploadMediaBodySchema = t.Object({
  file: t.Union([t.File(), t.Array(t.File())]),
  type: t.Optional(t.String()),
  owner_type: t.Optional(t.String()),
  owner_id: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
});

type NormalizedPaginatedMediaInput = {
  page?: number;
  limit?: number;
  search?: string;
  sorting_direction?: "asc" | "desc";
  sorting_field?: string;
  filters?: {
    type?: string;
    owner_type?: string;
    owner_id?: string;
    mime_type?: string;
  };
};

type PaginatedMediaRunner = {
  runOperations(context: { input: NormalizedPaginatedMediaInput }): Promise<{
    rows: unknown[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      has_next_page: boolean;
      has_previous_page: boolean;
    };
  }>;
};

export const mediaRoutes = new Elysia({ prefix: "/media" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedMediaRunner>(PAGINATED_MEDIA_PROCESS);
      const input: NormalizedPaginatedMediaInput = {
        page: query.page !== undefined ? Number(query.page) : undefined,
        limit: query.limit !== undefined ? Number(query.limit) : undefined,
        search: query.search,
        sorting_direction: query.sorting_direction,
        sorting_field: query.sorting_field,
        filters: query.filters,
      };
      return process.runOperations({
        input,
      });
    },
    {
      query: PaginatedMediaSchema,
      response: {
        200: PaginatedMediaResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Media"],
        summary: "Get paginated media",
        description: "Lists media files persisted in database.",
      },
    }
  )
  .post(
    "/upload",
    async ({ body }: { body: { file: File | File[]; type?: string; owner_type?: string; owner_id?: string | null } }) => {
      const process = getService<UploadMediaProcess>(UPLOAD_MEDIA_PROCESS);
      return process.runOperations({
        input: {
          file: body.file,
          type: body.type ?? "global_image",
          owner_type: body.owner_type,
          owner_id: body.owner_id ?? undefined,
        },
      });
    },
    {
      type: "multipart/form-data",
      body: UploadMediaBodySchema,
      response: {
        200: t.Any(),
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Media"],
        summary: "Upload media file",
        description: "Uploads a file to S3 and stores metadata in DB.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    oneOf: [
                      { type: "string", format: "binary" },
                      {
                        type: "array",
                        items: { type: "string", format: "binary" },
                      },
                    ],
                  },
                  type: { type: "string" },
                  owner_type: { type: "string" },
                  owner_id: { type: "string", format: "uuid", nullable: true },
                },
                required: ["file"],
              },
            },
          },
        },
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const process = getService<DeleteMediaProcess>(DELETE_MEDIA_PROCESS);
      await process.runOperations({
        input: { ids: [params.id] },
      });
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String({ format: "uuid" }) }),
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Media"],
        summary: "Delete media file",
        description: "Deletes media from S3 and DB by id.",
      },
    }
  );
