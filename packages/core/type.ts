import type { Logger } from "@logtape/logtape";
import type { BunPostgresDialectConfig } from "kysely-bun-sql";
import type { TSchema, Static , TIntersect, TObject} from "@sinclair/typebox";

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

export interface ProcessContextType<TInput extends TObject<any> | TIntersect<any>> {
  input: Static<TInput>;
};

export interface ProcessContract<TProcessReturn = void> {
  runOperations<T extends TObject<any> | TIntersect<any>>(context: ProcessContextType<T>): Promise<TProcessReturn>;
}
