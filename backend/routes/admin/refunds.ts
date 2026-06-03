import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_REFUND_PROCESS,
  UPDATE_REFUND_PROCESS,
  DELETE_REFUNDS_PROCESS,
  PAGINATED_REFUNDS_PROCESS,
  LIST_REFUND_STATUSES_PROCESS,
  CreateRefundProcess,
  UpdateRefundProcess,
  DeleteRefundsProcess,
  PaginatedRefundsProcess,
  ListRefundStatusesProcess,
  CreateRefundSchema,
  CreateRefundResponseSchema,
  UpdateRefundSchema,
  UpdateRefundResponseSchema,
  DeleteRefundsSchema,
  PaginatedRefundsSchema,
  PaginatedRefundsResponseSchema,
  ListRefundStatusesSchema,
  ListRefundStatusesResponseSchema,
} from "@danimai/payment";
import {
  VERIFY_ACCESS_TOKEN_PROCESS,
  VerifyAccessTokenProcess,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const CreateRefundBodySchema = Type.Omit(CreateRefundSchema, ["created_by"]);
const UpdateRefundBodySchema = Type.Omit(UpdateRefundSchema, ["id"]);

export const refundRoutes = new Elysia({ prefix: "/refunds" })
  .use(bearer())
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedRefundsProcess>(
        PAGINATED_REFUNDS_PROCESS,
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedRefundsSchema>,
      });
    },
    {
      query: PaginatedRefundsSchema,
      response: {
        200: PaginatedRefundsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refunds"],
        summary: "Get paginated refunds",
        description: "Gets a paginated list of refunds with optional filters",
      },
    },
  )
  .get(
    "/statuses",
    async ({ query }) => {
      const process = getService<ListRefundStatusesProcess>(
        LIST_REFUND_STATUSES_PROCESS,
      );
      return process.runOperations({
        input: query as StaticDecode<typeof ListRefundStatusesSchema>,
      });
    },
    {
      query: ListRefundStatusesSchema,
      response: {
        200: ListRefundStatusesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refunds"],
        summary: "List refund status options",
        description:
          "Returns refund status options with optional search on id or label",
      },
    },
  )
  .post(
    "/",
    async ({ bearer, body, set }) => {
      if (!bearer) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "Missing Authorization header",
        };
      }
      const verifyProcess = getService<VerifyAccessTokenProcess>(
        VERIFY_ACCESS_TOKEN_PROCESS,
      );
      const { id: adminUserId } = await verifyProcess.runOperations({
        input: { access_token: bearer },
      });
      const process = getService<CreateRefundProcess>(CREATE_REFUND_PROCESS);
      return process.runOperations({
        input: {
          ...(body as StaticDecode<typeof CreateRefundBodySchema>),
          created_by: adminUserId,
        },
      });
    },
    {
      body: CreateRefundBodySchema,
      response: {
        200: CreateRefundResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refunds"],
        summary: "Create a refund",
        description:
          "Creates a refund for a payment transaction. payment_id and customer_id are derived from the transaction.",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateRefundProcess>(UPDATE_REFUND_PROCESS);
      return process.runOperations({
        input: {
          ...(body as StaticDecode<typeof UpdateRefundBodySchema>),
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdateRefundSchema.properties.id }),
      body: UpdateRefundBodySchema,
      response: {
        200: UpdateRefundResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refunds"],
        summary: "Update a refund",
        description: "Updates a refund status or metadata",
      },
    },
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteRefundsProcess>(DELETE_REFUNDS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteRefundsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Refunds"],
        summary: "Delete refunds",
        description: "Soft-deletes refunds by their IDs",
      },
    },
  );
