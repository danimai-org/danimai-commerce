import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  ACCEPT_INVITE_PROCESS,
  AcceptInviteProcess,
  type AcceptInviteProcessInput,
  AcceptInviteSchema,
  CREATE_INVITE_PROCESS,
  CreateInviteProcess,
  type CreateInviteProcessInput,
  CreateInviteSchema,
  PAGINATED_INVITES_PROCESS,
  PaginatedInvitesProcess,
  type PaginatedInvitesProcessInput,
  PaginatedInvitesSchema,
  RESEND_INVITE_PROCESS,
  ResendInviteProcess,
  type ResendInviteProcessInput,
  ResendInviteSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const inviteRoutes = new Elysia({ prefix: "/invites" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedInvitesProcess>(PAGINATED_INVITES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedInvitesSchema, query) as PaginatedInvitesProcessInput,
          logger,
        });
        const data = result.data.map(({ token: _t, ...invite }) => invite);
        return { ...result, data };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["invites"],
        summary: "List invites",
        description: "Returns paginated list of invites",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateInviteProcess>(CREATE_INVITE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(CreateInviteSchema, body) as CreateInviteProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["invites"],
        summary: "Create invite",
        description: "Creates an invite for a new user by email",
        requestBody: {
          content: {
            "application/json": {
              example: { email: "user@example.com", role_id: "550e8400-e29b-41d4-a716-446655440000" },
            },
          },
        },
      },
    }
  )
  .post(
    "/accept",
    async ({ body, set }) => {
      try {
        const process = getService<AcceptInviteProcess>(ACCEPT_INVITE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(AcceptInviteSchema, body) as AcceptInviteProcessInput;
        const result = await process.runOperations({ input, logger });
        if (!result) return result;
        const { password_hash: _p, ...user } = result;
        return user;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["invites"],
        summary: "Accept invite",
        description: "Accepts an invite with token and creates user account with password",
        requestBody: {
          content: {
            "application/json": {
              example: { token: "invite-token-from-email", password: "securepassword" },
            },
          },
        },
      },
    }
  )
  .post(
    "/:id/resend",
    async ({ params, set }) => {
      try {
        const process = getService<ResendInviteProcess>(RESEND_INVITE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(ResendInviteSchema, { id: params.id }) as ResendInviteProcessInput;
        const result = await process.runOperations({ input, logger });
        if (!result) return result;
        const { token: _t, ...invite } = result;
        return invite;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["invites"],
        summary: "Resend invite",
        description: "Resends an invite email with a new token and expiry",
      },
    }
  );
