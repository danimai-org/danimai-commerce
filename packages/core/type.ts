import type { Logger } from "@logtape/logtape";
import type { TObject, StaticDecode } from "@sinclair/typebox";

export type DatabaseConfig = {
  url?: string;
};

export interface DanimaiInitialize {
  db: DatabaseConfig;
  logger: Logger;
  config: {
    stripeKey: string;
    stripePublishableKey: string;
    defaultCurrency: string;
    email: {
      resendApiKey: string;
      from: string;
      templateFolder: string;
    }
    jwt: {
      secret: string;
    }
    aws?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      s3Bucket: string;
      mediaCloudfrontUrl?: string;
    }
    media?: {
      storage: "s3" | "local";
      localUploadDir?: string;
      localBaseUrl?: string;
    }
    password?: {
      algorithm: Bun.Password.AlgorithmLabel;
      cost: number;
    }
  };
}

export interface ProcessContextType<TInput extends TObject<any>> {
  input: StaticDecode<TInput>;
};

export interface ProcessContract<TInput extends TObject<any>, TProcessReturn = void> {
  runOperations(context: ProcessContextType<TInput>): Promise<TProcessReturn>;
}
