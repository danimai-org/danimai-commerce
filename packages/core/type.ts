import type { Logger } from "@logtape/logtape";
import type { BunPostgresDialectConfig } from "kysely-bun-sql";
import type { TSchema } from "typebox";
import Type from "typebox";

export interface DanimaiInitialize {
  db: BunPostgresDialectConfig;
  logger: Logger;
  config: {
    stripeKey: string;
    defaultCurrency: string;
    email: {
      resendApiKey: string;
      from: string;
      templateFolder: string;
    }
    jwt: {
      secret: string;
    }
    password?: {
      algorithm: Bun.Password.AlgorithmLabel;
      cost: number;
    }
  };
}

export interface ProcessContextType<TInput extends TSchema> {
  input: Type.Static<TInput>;
};

export interface ProcessContract<TProcessReturn = void> {
  runOperations(context: ProcessContextType<TSchema>): Promise<TProcessReturn>;
}
