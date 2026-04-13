import { inject } from "inversify";
import { DANIMAI_LOGGER } from "../injection-keys";

/**
 * Purpose: Injects the shared logger dependency for process/runtime logging.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_LOGGER` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives container-managed logger instance.
 * Example: `constructor(@InjectLogger() private readonly logger: Logger) {}`
 */
export const InjectLogger = () => inject(DANIMAI_LOGGER);
