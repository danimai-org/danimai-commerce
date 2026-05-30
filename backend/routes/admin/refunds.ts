import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_REFUND_PROCESS,
  UPDATE_REFUND_PROCESS,
  PAGINATED_REFUNDS_PROCESS,
  CreateRefundProcess,
  UpdateRefundProcess,
  PaginatedRefundsProcess,
  CreateRefundSchema,
  CreateRefundResponseSchema,
  UpdateRefundSchema,
  UpdateRefundResponseSchema,
  PaginatedRefundsSchema,
  PaginatedRefundsResponseSchema,
} from "@danimai/payment";
import {
  VERIFY_ACCESS_TOKEN_PROCESS,
  VerifyAccessTokenProcess,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
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
  );
