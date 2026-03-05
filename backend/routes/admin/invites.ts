import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
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
  PaginatedInvitesResponseSchema,
  CreateInviteSchema,
  CreateInviteResponseSchema,
  AcceptInviteSchema,
  AcceptInviteResponseSchema,
  ResendInviteResponseSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const toDateString = (v: string | Date | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : v;

function serializeInviteDates<T extends Record<string, unknown>>(invite: T): T {
  return {
    ...invite,
    created_at: toDateString(invite.created_at as string | Date | null) ?? invite.created_at,
    updated_at: toDateString(invite.updated_at as string | Date | null) ?? invite.updated_at,
    deleted_at: toDateString(invite.deleted_at as string | Date | null),
    expires_at: toDateString(invite.expires_at as string | Date | null) ?? invite.expires_at,
  } as T;
}

export const inviteRoutes = new Elysia({ prefix: "/invites" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedInvitesProcess>(PAGINATED_INVITES_PROCESS);
      const result = await process.runOperations({ input });
      if (!result) {
        throw new Error("Failed to list invites");
      }
      const rows = result.rows.map(({ token: _t, ...invite }: any) =>
        serializeInviteDates(invite as Record<string, unknown>)
      );
      return { ...result, rows } as any;
    },
    {
      query: PaginatedInvitesSchema,
      response: {
        200: PaginatedInvitesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      const result = await process.runOperations({ input });
      if (result === undefined) throw new Error("Failed to create invite");
      return result;
    },
    {
      body: CreateInviteSchema,
      response: {
        200: CreateInviteResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      const result = await process.runOperations({ input });
      if (!result) return result as any;
      const { password_hash: _p, ...user } = result;
      return user as any;
    },
    {
      body: AcceptInviteSchema,
      response: {
        200: AcceptInviteResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      const input = { id: params.id };
      const result = await process.runOperations({ input });
      if (!result) throw new Error("Invite not found or resend failed");
      const { token: _t, ...invite } = result;
      return invite as any;
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: ResendInviteResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Invites"],
        summary: "Resend invite",
        description: "Resends an invite email with a new token and expiry",
      },
    }
  );
