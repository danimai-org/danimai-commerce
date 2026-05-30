import { inject } from "inversify";
import { DANIMAI_STRIPE } from "../injection-keys";

/**
 * Purpose: Injects the shared Stripe client into process constructors.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_STRIPE` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives IoC-managed Stripe client instance.
 * Example: `constructor(@InjectStripe() private readonly stripe: Stripe) {}`
 */
export const InjectStripe = () => inject(DANIMAI_STRIPE);
