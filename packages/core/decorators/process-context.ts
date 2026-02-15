import "reflect-metadata";
import type { TSchema } from "typebox";
import Value from "typebox/value";
import type { ProcessContextType } from "../type";
import { ValidationError } from "../errors/validation.error";
import type { ValueErrorType } from "../errors/value-error-type";

const PARAMETER_METADATA_KEY = Symbol("process_context_parameters");
const WRAPPED_FLAG = Symbol("process_context_wrapped");

interface ParameterMetadata {
    parameterIndex: number;
    schema: TSchema;
}

export interface ProcessContextDecoratorOptions<TInput extends TSchema> {
    schema: TInput;
}

export function ProcessContext<TInput extends TSchema>(
    options: ProcessContextDecoratorOptions<TInput>
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        if (!propertyKey) {
            throw new Error("ProcessContext decorator must be used on a method parameter");
        }

        // Store parameter metadata - this is the main purpose of the parameter decorator
        const existingMetadata: ParameterMetadata[] =
            Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];

        existingMetadata.push({
            parameterIndex,
            schema: options.schema,
        });

        Reflect.defineMetadata(PARAMETER_METADATA_KEY, existingMetadata, target, propertyKey);

        // Note: We don't wrap here because parameter decorators run before methods are fully defined
        // The wrapping will happen in the Process class decorator
    };
}

// Export function to wrap all methods that have ProcessContext decorators
export function wrapMethodsWithProcessContext(target: any) {
    // Get all property keys from the prototype
    const propertyKeys = [
        ...Object.getOwnPropertyNames(target),
        ...Object.getOwnPropertySymbols(target),
    ];

    for (const propertyKey of propertyKeys) {
        // Check if this method has ProcessContext metadata
        const paramMetadata = Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) as ParameterMetadata[] | undefined;

        if (!paramMetadata || paramMetadata.length === 0) {
            continue; // No ProcessContext decorators on this method
        }

        const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);

        if (!descriptor || typeof descriptor.value !== "function") {
            continue; // Not a method or doesn't exist
        }

        // Check if already wrapped
        if ((descriptor.value as any)[WRAPPED_FLAG]) {
            continue; // Already wrapped
        }

        const originalMethod = descriptor.value;

        // Create wrapper function
        const wrappedMethod = function (this: any, ...args: any[]) {
            // Validate all parameters that have ProcessContext decorators
            for (const meta of paramMetadata) {
                const contextArg = args[meta.parameterIndex] as ProcessContextType<typeof meta.schema> | undefined;

                if (contextArg && contextArg.input !== undefined) {
                    const isValid = Value.Check(meta.schema, contextArg.input);

                    if (!isValid) {
                        const errors = Array.from(Value.Errors(meta.schema, contextArg.input));

                        // Flatten errors - split grouped errors (like multiple required properties) into individual errors
                        const flattenedErrors: Array<{ type: ValueErrorType; message: string; path: string }> = [];

                        for (const error of errors) {
                            // If it's a "required" error with multiple properties, split them
                            if (error.keyword === "required" && error.params?.requiredProperties) {
                                const requiredProperties = error.params.requiredProperties as string[];
                                for (const property of requiredProperties) {
                                    flattenedErrors.push({
                                        type: "required" as ValueErrorType,
                                        message: `is required field`,
                                        path: error.instancePath ? `${error.instancePath}/${property}` : property,
                                    });
                                }
                            } else {
                                // For other error types, use the error as-is but fix the path
                                const path = error.instancePath.replace(/^\//, "") || error.schemaPath || "";
                                flattenedErrors.push({
                                    type: (error.keyword as string) as ValueErrorType,
                                    message: error.message || "Validation failed",
                                    path: path,
                                });
                            }
                        }

                        throw new ValidationError(
                            `Validation failed`,
                            flattenedErrors
                        );
                    }
                }
            }

            // Call original method with ALL original arguments
            return originalMethod.apply(this, args);
        };

        // Mark as wrapped
        (wrappedMethod as any)[WRAPPED_FLAG] = true;

        // Replace the method on the prototype
        descriptor.value = wrappedMethod;
        Object.defineProperty(target, propertyKey, descriptor);
    }
}
