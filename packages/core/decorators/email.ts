import { inject } from "inversify";
import { DANIMAI_EMAIL } from "../injection-keys";

export const InjectEmail = () => inject(DANIMAI_EMAIL);