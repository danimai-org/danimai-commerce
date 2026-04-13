import { inject } from "inversify";
import { DANIMAI_PASSWORD } from "../injection-keys";

/**
 * Purpose: Injects the password service for hashing and password verification.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_PASSWORD` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives the configured password provider.
 * Example: `constructor(@InjectPassword() private readonly password: PasswordService) {}`
 */
export const InjectPassword = () => inject(DANIMAI_PASSWORD);