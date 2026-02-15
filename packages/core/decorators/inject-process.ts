import { inject } from "inversify";

export const InjectProcess = (processSymbol: symbol) => inject(processSymbol);
