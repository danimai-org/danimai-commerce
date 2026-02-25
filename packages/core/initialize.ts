import { Container } from "inversify";
import { DANIMAI_DB, DANIMAI_LOGGER, DANIMAI_CONFIG, DANIMAI_INITIALIZED, DANIMAI_EMAIL, DANIMAI_JWT, DANIMAI_PASSWORD } from "./injection-keys";
import type { DanimaiInitialize, ProcessContract } from "./type";
import { Kysely, ParseJSONResultsPlugin, type LogEvent } from "kysely";
import { BunPostgresDialect } from "kysely-bun-sql";
import { bindAllProcesses, getProcessClass } from "./decorators/process";
import { ResendEmail } from "./email";
import { Jwt, Password } from "./security";

const ANSI = { blue: "\x1b[34m", red: "\x1b[31m", reset: "\x1b[0m" };

type QueryCaller = { packageTag: string; processInfo: string } | null;

/** Derive [Package] tag and process/caller from the first app-code stack frame. */
function getQueryCaller(): QueryCaller {
  const stack = new Error().stack ?? "";
  const lines = stack.split("\n").slice(1);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes("node_modules") || trimmed.includes("kysely")) continue;

    const pathMatch = trimmed.match(/(?:file:\/\/)?([^)\s]+\.(?:ts|js|mts|mjs))(?::\d+)?(?::\d+)?/);
    const rawPath = pathMatch && pathMatch[1] ? pathMatch[1].replace(/^file:\/\//, "") : "";
    const path = rawPath.replace(/\\/g, "/");

    if (path.includes("packages/core")) continue;
    const isPackages = path.includes("packages/");
    const isBackend = path.includes("backend");
    if (!isPackages && !isBackend) continue;

    const fnMatch = trimmed.match(/at\s+(?:async\s+)?([\w.]+)/);
    const fnName = fnMatch ? fnMatch[1] : "";

    let packageTag = "App";
    const pkgMatch = path.match(/packages[/\\]([^/\\]+)/);
    if (pkgMatch && pkgMatch[1]) {
      const name = pkgMatch[1];
      packageTag = name.charAt(0).toUpperCase() + name.slice(1).replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
    } else if (isBackend) packageTag = "Backend";

    const fileName = path.split("/").pop()?.replace(/\.(ts|js|mts|mjs)$/, "") ?? "";
    const processName = fnName && fnName !== "log" && fnName !== "handler" ? fnName : fileName || "process";
    return { packageTag: `[${packageTag}]`, processInfo: processName };
  }
  return null;
}

// Global container instance
let container: Container | null = null;

export const getContainer = (): Container => {
  if (!container) {
    throw new Error("Container not initialized. Please call initialize() first.");
  }
  return container;
};

export const initialize = ({ db, logger, config }: DanimaiInitialize) => {

  const emailConfig = config.email;
  const jwtConfig = config.jwt;
  const passwordConfig = config.password;

  if (container && container.isBound(DANIMAI_INITIALIZED) && container.get(DANIMAI_INITIALIZED)) {
    return;
  }

  // Create new container if it doesn't exist
  if (!container) {
    container = new Container();
  }

  // Bind services
  if (!container.isBound(DANIMAI_INITIALIZED)) {
    container.bind<boolean>(DANIMAI_INITIALIZED).toConstantValue(true);
  }
  if (!container.isBound(DANIMAI_DB)) {
    container.bind(DANIMAI_DB).toConstantValue(
      new Kysely({
        dialect: new BunPostgresDialect(db),
        log: (event: LogEvent) => {
          let caller = getQueryCaller();
          if (!caller && event.query.sql) {
            const sql = event.query.sql.toLowerCase();
            const tableMatch = sql.match(/(?:from|into|update|join)\s+["']?(\w+)["']?/);
            const table = tableMatch ? tableMatch[1] : "";
            const domain = table ? table.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim() : "DB";
            caller = { packageTag: `[${domain}]`, processInfo: "process" };
          }
          const header = caller
            ? `${caller.packageTag} --> ${caller.processInfo}`
            : "Processes called";
          const timeMs = event.queryDurationMillis.toFixed(2);
          const queryLine = `${ANSI.blue}[Query Time]${ANSI.reset} ${timeMs}ms ${ANSI.red}|${ANSI.reset} ${ANSI.blue}[Query]${ANSI.reset} ${event.query.sql}`;

          if (event.level === "query") {
            logger.info(`${header}`);
            logger.info(`  ${queryLine}`);
          }

          if (event.level === "error") {
            const errLine = `${ANSI.blue}[Query Time]${ANSI.reset} ${timeMs}ms ${ANSI.red}|${ANSI.reset} ${ANSI.blue}[Error]${ANSI.reset} Query failed`;
            logger.error(`${header}`);
            logger.error(`  ${errLine}`);
            logger.error(`  SQL: ${event.query.sql}`);
            logger.error(`  Error: ${event.error}`);
          }
        }, plugins: [new ParseJSONResultsPlugin()] })
    );
  }

  if (!container.isBound(DANIMAI_LOGGER)) {
    container.bind(DANIMAI_LOGGER).toConstantValue(logger);
  }
  if (!container.isBound(DANIMAI_CONFIG)) {
    container.bind(DANIMAI_CONFIG).toConstantValue(config);
  }
  if (!container.isBound(DANIMAI_EMAIL)) {
    container.bind(DANIMAI_EMAIL).toConstantValue(new ResendEmail(emailConfig.resendApiKey, emailConfig.from, emailConfig.templateFolder));
  }
  if (!container.isBound(DANIMAI_JWT)) {
    container.bind(DANIMAI_JWT).toConstantValue(new Jwt(jwtConfig.secret));
  }
  if (!container.isBound(DANIMAI_PASSWORD)) {
    container.bind(DANIMAI_PASSWORD).toConstantValue(new Password(passwordConfig?.algorithm ?? "bcrypt", passwordConfig?.cost ?? 10));
  }
  // Auto-bind all registered process classes (may be empty if processes not imported yet)
  bindAllProcesses(container);
};

export const getProcess = <T extends ProcessContract>(processName: symbol) => {
  const cont = getContainer();

  // Lazy binding: if process is not bound, try to bind it now
  if (!cont.isBound(processName)) {
    const processClass = getProcessClass(processName);
    if (processClass) {
      cont.bind(processName).to(processClass);
    } else {
      throw new Error(`Process with identifier ${processName.toString()} is not registered. Make sure the process class is imported.`);
    }
  }

  return cont.get<T>(processName);
};

export const getService = <T>(serviceName: symbol) => {
  const cont = getContainer();

  // Lazy binding: if service is not bound, try to bind it as a process
  if (!cont.isBound(serviceName)) {
    const processClass = getProcessClass(serviceName);
    if (processClass) {
      cont.bind(serviceName).to(processClass);
    } else {
      throw new Error(`Service with identifier ${serviceName.toString()} is not bound to container.`);
    }
  }

  return cont.get<T>(serviceName) as T;
};