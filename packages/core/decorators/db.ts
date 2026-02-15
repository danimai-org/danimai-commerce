import { inject } from "inversify";
import { DANIMAI_DB } from "../injection-keys";

export const InjectDB = () => inject(DANIMAI_DB);
