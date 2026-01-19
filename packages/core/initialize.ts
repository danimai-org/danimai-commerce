import { Container } from "typedi";
import { DANIMAI_DB, DANIMAI_LOGGER, DANIMAI_CONFIG } from "./injection-keys";
import { DanimaiInitialize } from "./type";
import { Kysely } from "kysely";
import { BunPostgresDialect } from "kysely-bun-sql";

export const initialize = ({ db, logger, config }: DanimaiInitialize) => {
  Container.set(
    DANIMAI_DB,
    new Kysely({ dialect: new BunPostgresDialect(db) })
  );
  Container.set(DANIMAI_LOGGER, logger);
  Container.set(DANIMAI_CONFIG, config);
};
