import { inject } from "inversify";
import { DANIMAI_EMAIL } from "../injection-keys";

/**
 * Purpose: Injects the email service abstraction for outbound email operations.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_EMAIL` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives the configured email provider implementation.
 * Example: `constructor(@InjectEmail() private readonly email: EmailService) {}`
 */
export const InjectEmail = () => inject(DANIMAI_EMAIL);