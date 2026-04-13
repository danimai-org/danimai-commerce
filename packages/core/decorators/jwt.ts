import { inject } from "inversify";
import { DANIMAI_JWT } from "../injection-keys";

/**
 * Purpose: Injects the JWT service used for token signing and verification.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_JWT` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives the configured JWT provider.
 * Example: `constructor(@InjectJwt() private readonly jwt: JwtService) {}`
 */
export const InjectJwt = () => inject(DANIMAI_JWT);