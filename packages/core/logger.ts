import { getLogger, configureSync, getConsoleSink } from "@logtape/logtape";

export const createConsoleLogger = (processName: string) => {
  configureSync({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      { category: [processName], lowestLevel: "debug", sinks: ["console"] },
    ],
  });

  return getLogger([processName]);
};
