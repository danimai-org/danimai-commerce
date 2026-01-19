import { createConsoleLogger } from "@danimai/core";
import { Logger } from "@logtape/logtape";

let logger: Logger;
export const getLogger = () => {
  if (!logger) {
    logger = createConsoleLogger("Backend");
  }
  return logger;
};
