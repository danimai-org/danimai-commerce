import { inject } from "inversify";
import { DANIMAI_PASSWORD } from "../injection-keys";

export const InjectPassword = () => inject(DANIMAI_PASSWORD);