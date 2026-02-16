import "reflect-metadata";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { initialize } from "@danimai/core";
import { getLogger } from "./logger";
import { routes } from "./routes";

const logger = getLogger();

// Initialize the core system with database, logger, and config
// TODO: Replace with actual database configuration from environment variables
initialize({
  db: {
    url: process.env.DATABASE_URL || "",
  },
  logger,
  config: {
    stripeKey: Bun.env.STRIPE_KEY || "",
    defaultCurrency: Bun.env.DEFAULT_CURRENCY || "USD",
    email: {
      resendApiKey: Bun.env.RESEND_API_KEY || "",
      from: Bun.env.EMAIL_FROM || "",
      templateFolder: Bun.env.EMAIL_TEMPLATE_FOLDER || "",
    },
    jwt: {
      secret: Bun.env.JWT_SECRET || "",
    },
  },
});

const requestStartTimes = new WeakMap<Request, number>();
const requestIds = new WeakMap<Request, string>();
let requestCounter = 0;

function getRequestId(): string {
  return `${Date.now().toString(36)}-${(++requestCounter).toString(36)}`;
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max) + "...";
}

const serverLogger = new Elysia({ name: "server-logger" })
  .onRequest(({ request }) => {
    requestStartTimes.set(request, Date.now());
    requestIds.set(request, getRequestId());
    const url = new URL(request.url);
    const pathWithSearch = url.pathname + (url.search || "");
    const reqId = requestIds.get(request);
    const userAgent = request.headers.get("user-agent") ?? "";
    const referer = request.headers.get("referer") ?? "";
    const uaShort = truncate(userAgent, 50);
    logger.info(
      `→ Incoming  ${request.method} ${pathWithSearch}  [${reqId}]  ${uaShort}${referer ? `  referer=${truncate(referer, 50)}` : ""}`
    );
  })
  .onAfterResponse(({ request, set }) => {
    const start = requestStartTimes.get(request);
    const durationMs = start != null ? Math.round(Date.now() - start) : null;
    const url = new URL(request.url);
    const status = typeof set.status === "number" ? set.status : Number(set.status) || 0;
    const statusLabel = status >= 200 && status < 300 ? "OK" : status >= 400 && status < 500 ? "ClientError" : "ServerError";
    const reqId = requestIds.get(request);
    logger.info(
      `← Completed  ${request.method} ${url.pathname}  ${set.status} ${statusLabel}  ${durationMs != null ? durationMs + "ms" : "—"}  [${reqId}]`
    );
  })
  .onError(({ request, code, error }) => {
    const msg = error instanceof Error ? error.message : String(error);
    const url = request ? new URL(request.url) : null;
    const reqId = request ? requestIds.get(request) : "—";
    logger.error(`✗ Error  [${reqId}]  ${code}  ${msg}  ${url ? url.pathname : ""}`);
  });

const app = new Elysia()
  .use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }))
  .use(serverLogger)
  .use(
    swagger({
      documentation: {
        info: {
          title: "Danimai Commerce API",
          description: "API documentation for Danimai Commerce backend",
          version: "1.0.0",
        },
        tags: [
          { name: "products", description: "Product management endpoints" },
          { name: "collections", description: "Collection management endpoints" },
          { name: "product-categories", description: "Product category management endpoints" },
          { name: "product-options", description: "Product option management endpoints" },
          { name: "product-tags", description: "Product tag management endpoints" },
          { name: "product-variants", description: "Product variant management endpoints" },
          { name: "sales-channels", description: "Sales channel management endpoints" },
          { name: "currencies", description: "Currency management endpoints" },
          { name: "regions", description: "Region management endpoints" },
          { name: "tax-regions", description: "Tax region management endpoints" },
          { name: "stores", description: "Store management endpoints" },
          { name: "users", description: "User management endpoints" },
          { name: "roles", description: "Role management endpoints" },
          { name: "permissions", description: "Permission management endpoints" },
          { name: "auth", description: "Authentication endpoints" },
          { name: "invites", description: "User invite endpoints" },
          { name: "customers", description: "Customer management endpoints" },
          { name: "inventory", description: "Inventory management endpoints" },
          { name: "stock-locations", description: "Stock location management endpoints" },
        ],
      },
    })
  )
  .use(routes)
  .listen(8000, () => {
    logger.info("Server started on http://localhost:8000");
    logger.info("Swagger documentation available at http://localhost:8000/swagger");
  });

const server = (app as { server?: { stop?: (force?: boolean) => Promise<void> } }).server;
function shutdown() {
  if (typeof server?.stop === "function") {
    server.stop(true).then(() => process.exit(0)).catch(() => process.exit(1));
  } else {
    process.exit(0);
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
