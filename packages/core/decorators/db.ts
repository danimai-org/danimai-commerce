import { inject } from "inversify";
import { DANIMAI_DB } from "../injection-keys";

/**
 * Purpose: Injects the shared database client into process constructors.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_DB` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives IoC-managed DB instance.
 * Example: `constructor(@InjectDB() private readonly db: Kysely<Database>) {}`
 */
export const InjectDB = () => inject(DANIMAI_DB);
