import { inject } from "inversify";
import { DANIMAI_JWT } from "../injection-keys";

export const InjectJwt = () => inject(DANIMAI_JWT);