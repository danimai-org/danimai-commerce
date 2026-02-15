import { inject } from "inversify";
import { DANIMAI_CONTEXT } from "../injection-keys";

export const InjectContext = () => inject(DANIMAI_CONTEXT);
