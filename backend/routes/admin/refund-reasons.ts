import { Elysia } from "elysia";
import { type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_REFUND_REASONS_PROCESS,
  PaginatedRefundReasonsProcess,
  PaginatedRefundReasonsSchema,
  PaginatedRefundReasonsResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

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
        description: "Gets a paginated list of refund reasons with optional search",
      },
    },
  );
