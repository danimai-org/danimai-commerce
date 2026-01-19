import { Inject } from "typedi";
import { DANIMAI_CONTEXT } from "../injection-keys";

export const InjectContext = () => Inject(DANIMAI_CONTEXT);
