import { Inject } from "typedi";
import { DANIMAI_LOGGER } from "../injection-keys";

export const InjectLogger = () => Inject(DANIMAI_LOGGER);
