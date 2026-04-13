import { Container, injectable } from "inversify";
import type { ProcessContract } from "../type";
import { wrapMethodsWithProcessContext } from "./process-context";

// Store process classes for later binding
const processClasses = new Map<symbol, any>();

/**
 * Purpose: Registers a process class in the container and wires method-level ProcessContext validation.
 * Target: class
 * Arguments: `name` (symbol process identifier, required, unique per process class)
 * Runtime behavior: runs at class definition time; marks class injectable, wraps decorated methods, and stores class by symbol.
 * Side effects: metadata-driven method wrapping and registration in in-memory process class map used for IoC binding.
 * Example: `@Process(CREATE_ORDER_PROCESS) export class CreateOrderProcess { ... }`
 */
export const Process = (name: symbol) => {
    return (target: any) => {
        // Apply injectable decorator
        injectable()(target);

        // Wrap all methods that have ProcessContext decorators
        // This ensures methods are wrapped after the class is fully defined
        wrapMethodsWithProcessContext(target.prototype);

        // Store the process class for later binding
        processClasses.set(name, target);

        return target;
    };
};

// Export function to bind all registered processes
export const bindAllProcesses = (container: Container) => {
    processClasses.forEach((processClass, identifier) => {
        if (!container.isBound(identifier)) {
            container.bind(identifier).to(processClass);
        }
    });
};

// Export function to get a process class by identifier (for lazy binding)
export const getProcessClass = (identifier: symbol): any => {
    return processClasses.get(identifier);
};
