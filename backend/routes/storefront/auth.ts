import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_CUSTOMER_SESSION_PROCESS,
  type CreateCustomerSessionProcess,
  CreateCustomerSessionSchema,
  CreateCustomerSessionResultSchema,
  CUSTOMER_FORGOT_PASSWORD_PROCESS,
  type CustomerForgotPasswordProcess,
  CustomerForgotPasswordSchema,
  CustomerForgotPasswordResponseSchema,
  CUSTOMER_LOGIN_PROCESS,
  type CustomerLoginProcess,
  CustomerLoginSchema,
  CustomerAuthTokensResponseSchema,
  CUSTOMER_RESET_PASSWORD_PROCESS,
  type CustomerResetPasswordProcess,
  CustomerResetPasswordSchema,
  CustomerResetPasswordResponseSchema,
  CUSTOMER_REFRESH_TOKEN_PROCESS,
  type CustomerRefreshTokenProcess,
  CUSTOMER_SIGNUP_PROCESS,
  type CustomerSignupProcess,
  CustomerSignupSchema,
  CustomerSignupResponseSchema,
  EXPIRE_CUSTOMER_SESSION_PROCESS,
  type ExpireCustomerSessionProcess,
  RETRIEVE_CUSTOMER_PROCESS,
  type RetrieveCustomerProcess,
  RetrieveCustomerResponseSchema,
  VERIFY_CUSTOMER_PROCESS,
  type VerifyCustomerProcess,
  VerifyCustomerSchema,
  VerifyCustomerResponseSchema,
  RefreshCustomerTokenSchema,
} from "@danimai/customer";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { loginRateLimitMacro } from "../../macros/login-rate-limit";
import { requireCustomerFromBearer } from "./customer-from-bearer";

const loginRoute = new Elysia().use(loginRateLimitMacro).post(
  "/login",
  async ({ body }: { body: StaticDecode<typeof CustomerLoginSchema> }) => {
    const process = getService<CustomerLoginProcess>(CUSTOMER_LOGIN_PROCESS);
    return process.runOperations({ input: body });
  },
  {
    body: CustomerLoginSchema,
    rateLimit: true,
    response: {
      200: CustomerAuthTokensResponseSchema,
      400: ValidationErrorResponseSchema,
      500: InternalErrorResponseSchema,
    },
    detail: {
      tags: ["Storefront Auth"],
      summary: "Customer login",
      description:
        "Email/password login for storefront customers; returns JWT access and refresh tokens.",
    },
  },
);

const refreshTokenRoute = new Elysia().post(
  "/refresh",
  async ({
    body,
  }: {
    body: StaticDecode<typeof RefreshCustomerTokenSchema>;
  }) => {
    const process = getService<CustomerRefreshTokenProcess>(
      CUSTOMER_REFRESH_TOKEN_PROCESS,
    );
    return process.runOperations({ input: body });
  },
  {
    body: RefreshCustomerTokenSchema,
    response: {
      200: CustomerAuthTokensResponseSchema,
      400: ValidationErrorResponseSchema,
      500: InternalErrorResponseSchema,
    },
    detail: {
      tags: ["Storefront Auth"],
      summary: "Refresh access token",
      description:
        "Exchange a valid refresh JWT for new access and refresh tokens (rotates refresh token).",
    },
  },
);

export const storefrontAuthRoutes = new Elysia({ prefix: "/auth" })
  .use(bearer())
  .onError(({ error, set }) => handleProcessError(error, set))
  .use(loginRoute)
  .use(refreshTokenRoute)
  .post(
    "/signup",
    async ({ body }: { body: StaticDecode<typeof CustomerSignupSchema> }) => {
      const process = getService<CustomerSignupProcess>(
        CUSTOMER_SIGNUP_PROCESS,
      );
      return process.runOperations({ input: body });
    },
    {
      body: CustomerSignupSchema,
      response: {
        200: CustomerSignupResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Auth"],
        summary: "Customer signup",
        description:
          "Register an email/password customer account. Sends a verification link to the email (no token in the JSON body).",
      },
    },
  )
  .post(
    "/forgot-password",
    async ({
      body,
    }: {
      body: StaticDecode<typeof CustomerForgotPasswordSchema>;
    }) => {
      const process = getService<CustomerForgotPasswordProcess>(
        CUSTOMER_FORGOT_PASSWORD_PROCESS,
      );
      return process.runOperations({ input: body });
    },
    {
      body: CustomerForgotPasswordSchema,
      response: {
        200: CustomerForgotPasswordResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Auth"],
        summary: "Forgot password",
        description: "Request a password reset token for the given email.",
      },
    },
  )
  .post(
    "/reset-password",
    async ({
      body,
    }: {
      body: StaticDecode<typeof CustomerResetPasswordSchema>;
    }) => {
      const process = getService<CustomerResetPasswordProcess>(
        CUSTOMER_RESET_PASSWORD_PROCESS,
      );
      return process.runOperations({ input: body });
    },
    {
      body: CustomerResetPasswordSchema,
      response: {
        200: CustomerResetPasswordResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Auth"],
        summary: "Reset password",
        description:
          "Set a new password using the reset token from forgot-password.",
      },
    },
  )
  .post(
    "/verify-email",
    async ({ body }: { body: StaticDecode<typeof VerifyCustomerSchema> }) => {
      const process = getService<VerifyCustomerProcess>(
        VERIFY_CUSTOMER_PROCESS,
      );
      return process.runOperations({ input: body });
    },
    {
      body: VerifyCustomerSchema,
      response: {
        200: VerifyCustomerResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Auth"],
        summary: "Verify email",
        description:
          "Activate account using the verification token from signup.",
      },
    },
  )
  .post(
    "/sessions",
    async ({
      body,
      request,
    }: {
      body: StaticDecode<typeof CreateCustomerSessionSchema>;
      request: Request;
    }) => {
      const process = getService<CreateCustomerSessionProcess>(
        CREATE_CUSTOMER_SESSION_PROCESS,
      );
      return process.runOperations({
        input: {
          ...body,
          user_agent:
            body.user_agent ?? request.headers.get("user-agent") ?? null,
        },
      });
    },
    {
      body: CreateCustomerSessionSchema,
      response: {
        200: CreateCustomerSessionResultSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Auth"],
        summary: "Create guest session",
        description:
          "Create a customer_sessions row for anonymous storefront use (e.g. cart).",
      },
    },
  )
  .post(
    "/logout",
    async ({ bearer, set }) => {
      const r = await requireCustomerFromBearer(bearer);
      if (!r.ok) {
        set.status = r.status;
        return r.body;
      }
      const process = getService<ExpireCustomerSessionProcess>(
        EXPIRE_CUSTOMER_SESSION_PROCESS,
      );
      await process.runOperations({ input: { id: r.sessionId } });
      set.status = 204;
      return undefined;
    },
    {
      response: {
        204: NoContentResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Auth"],
        summary: "Logout",
        description:
          "Expire the current customer session (Bearer access token required).",
      },
    },
  )
  .get(
    "/me",
    async ({ bearer, set }) => {
      const r = await requireCustomerFromBearer(bearer);
      if (!r.ok) {
        set.status = r.status;
        return r.body;
      }
      const process = getService<RetrieveCustomerProcess>(
        RETRIEVE_CUSTOMER_PROCESS,
      );
      return process.runOperations({ input: { id: r.customerId } });
    },
    {
      response: {
        200: RetrieveCustomerResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Auth"],
        summary: "Current customer",
        description:
          "Return the authenticated storefront customer (Bearer access token required).",
      },
    },
  );
