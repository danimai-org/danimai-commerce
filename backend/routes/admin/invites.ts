import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  ACCEPT_INVITE_PROCESS,
  AcceptInviteProcess,
  CREATE_INVITE_PROCESS,
  CreateInviteProcess,
  PAGINATED_INVITES_PROCESS,
  PaginatedInvitesProcess,
  RESEND_INVITE_PROCESS,
  ResendInviteProcess,
  PaginatedInvitesSchema,
  CreateInviteSchema,
  AcceptInviteSchema,
  ResendInviteSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";

export const inviteRoutes = new Elysia({ prefix: "/invites" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedInvitesProcess>(PAGINATED_INVITES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const result = await process.runOperations({ input, logger } as any);
      const data = result.data.map(({ token: _t, ...invite }) => invite);
      return { ...result, data };
    },
    {
      query: PaginatedInvitesSchema as any,
      detail: {
        tags: ["Invites"],
        summary: "List invites",
        description: "Returns paginated list of invites",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateInviteProcess>(CREATE_INVITE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateInviteSchema as any,
      detail: {
        tags: ["Invites"],
        summary: "Create invite",
        description: "Creates an invite for a new user by email",
      },
    }
  )
  .post(
    "/accept",
    async ({ body: input }) => {
      const process = getService<AcceptInviteProcess>(ACCEPT_INVITE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const result = await process.runOperations({ input, logger } as any);
      if (!result) return result;
      const { password_hash: _p, ...user } = result;
      return user;
    },
    {
      body: AcceptInviteSchema as any,
      detail: {
        tags: ["Invites"],
        summary: "Accept invite",
        description: "Accepts an invite with token and creates user account with password",
      },
    }
  )
  .post(
    "/:id/resend",
    async ({ params }) => {
      const process = getService<ResendInviteProcess>(RESEND_INVITE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { id: params.id };
      const result = await process.runOperations({ input, logger } as any);
      if (!result) return result;
      const { token: _t, ...invite } = result;
      return invite;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Invites"],
        summary: "Resend invite",
        description: "Resends an invite email with a new token and expiry",
      },
    }
  );
