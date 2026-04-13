import { inject } from "inversify";

/**
 * Purpose: Injects another process implementation by process symbol.
 * Target: parameter
 * Arguments: `processSymbol` (symbol identifier, required)
 * Runtime behavior: resolves dependency from inversify container during class instantiation.
 * Side effects: binds constructor parameter resolution to the provided process token.
 * Example: `constructor(@InjectProcess(RETRIEVE_USER_PROCESS) private readonly retrieveUser: RetrieveUserProcess) {}`
 */
export const InjectProcess = (processSymbol: symbol) => inject(processSymbol);
