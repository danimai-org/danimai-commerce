import { Container } from "inversify";
import { DANIMAI_DB, DANIMAI_LOGGER, DANIMAI_CONFIG, DANIMAI_INITIALIZED, DANIMAI_EMAIL, DANIMAI_JWT, DANIMAI_PASSWORD } from "./injection-keys";
import type { DanimaiInitialize, ProcessContract } from "./type";
import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { BunPostgresDialect } from "kysely-bun-sql";
import { bindAllProcesses, getProcessClass } from "./decorators/process";
import { ResendEmail } from "./email";
import { Jwt, Password } from "./security";

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
      new Kysely({ dialect: new BunPostgresDialect(db), plugins: [new ParseJSONResultsPlugin()] })
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