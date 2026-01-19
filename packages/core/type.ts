import type { Logger } from "@logtape/logtape";
import type { BunPostgresDialectConfig } from "kysely-bun-sql";

export interface DanimaiInitialize {
  db: BunPostgresDialectConfig;
  logger: Logger;
  config: {
    stripeKey: string;
    defaultCurrency: string;
  };
}

export type ProcessContext = {
  logger: Logger;
};

export interface ProcessContract<TProcessReturn = void> {
  runOperations(context: ProcessContext): Promise<TProcessReturn>;
}
