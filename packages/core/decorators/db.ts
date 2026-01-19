import { Inject } from "typedi";
import { DANIMAI_DB } from "../injection-keys";

export const InjectDB = () => Inject(DANIMAI_DB);
