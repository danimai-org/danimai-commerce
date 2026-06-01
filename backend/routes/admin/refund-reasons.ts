import { Elysia } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_REFUND_REASON_PROCESS,
  UPDATE_REFUND_REASON_PROCESS,
  DELETE_REFUND_REASONS_PROCESS,
  PAGINATED_REFUND_REASONS_PROCESS,
  CreateRefundReasonProcess,
  UpdateRefundReasonProcess,
  DeleteRefundReasonsProcess,
  PaginatedRefundReasonsProcess,
  CreateRefundReasonSchema,
  CreateRefundReasonResponseSchema,
  UpdateRefundReasonSchema,
  UpdateRefundReasonResponseSchema,
  DeleteRefundReasonsSchema,
  PaginatedRefundReasonsSchema,
  PaginatedRefundReasonsResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateRefundReasonBodySchema = Type.Omit(UpdateRefundReasonSchema, [
  "id",
]);

export const refundReasonRoutes = new Elysia({ prefix: "/refund-reasons" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedRefundReasonsProcess>(
        PAGINATED_REFUND_REASONS_PROCESS,
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedRefundReasonsSchema>,
      });
    },
    {
      query: PaginatedRefundReasonsSchema,
      response: {
        200: PaginatedRefundReasonsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refund Reasons"],
        summary: "Get paginated refund reasons",
        description:
          "Gets a paginated list of refund reasons with optional search",
      },
    },
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateRefundReasonProcess>(
        CREATE_REFUND_REASON_PROCESS,
      );
      return process.runOperations({ input });
    },
    {
      body: CreateRefundReasonSchema,
      response: {
        200: CreateRefundReasonResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refund Reasons"],
        summary: "Create a refund reason",
        description: "Creates a new refund reason",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateRefundReasonProcess>(
        UPDATE_REFUND_REASON_PROCESS,
      );
      return process.runOperations({
        input: {
          ...(body as StaticDecode<typeof UpdateRefundReasonBodySchema>),
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdateRefundReasonSchema.properties.id }),
      body: UpdateRefundReasonBodySchema,
      response: {
        200: UpdateRefundReasonResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refund Reasons"],
        summary: "Update a refund reason",
        description: "Updates a refund reason by id",
      },
    },
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteRefundReasonsProcess>(
        DELETE_REFUND_REASONS_PROCESS,
      );
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteRefundReasonsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refund Reasons"],
        summary: "Delete refund reasons",
        description: "Soft-deletes refund reasons by their IDs",
      },
    },
  );
