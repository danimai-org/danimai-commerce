import type { ValueErrorType } from "./value-error-type";

type ValidationErrorType = {
    type: ValueErrorType;
    message: string;
    path: string;
}

export class ValidationError extends Error {
    errors: ValidationErrorType[];

    constructor(message: string, errors: ValidationErrorType[]) {
        super(message);
        this.name = "ValidationError";
        this.errors = errors;
    }
}