import { getLogger, configureSync, getConsoleSink, ansiColorFormatter } from "@logtape/logtape";

export const createConsoleLogger = (processName: string) => {
  configureSync({
    sinks: {
      console: getConsoleSink({ formatter: ansiColorFormatter }),
    },
    loggers: [
      { category: [processName], lowestLevel: "debug", sinks: ["console"] },
    ],
  });

  return getLogger([processName]);
};
