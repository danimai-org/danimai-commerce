import { inject } from "inversify";
import { DANIMAI_CONTEXT } from "../injection-keys";

/**
 * Purpose: Injects request/runtime context services into classes.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_CONTEXT` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives the current context service instance.
 * Example: `constructor(@InjectContext() private readonly context: ContextService) {}`
 */
export const InjectContext = () => inject(DANIMAI_CONTEXT);
