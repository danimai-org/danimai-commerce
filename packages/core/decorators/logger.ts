import { inject } from "inversify";
import { DANIMAI_LOGGER } from "../injection-keys";

export const InjectLogger = () => inject(DANIMAI_LOGGER);
