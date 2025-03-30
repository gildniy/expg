/**
 * Type guard to check if an error is an Error object
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error || (
        error !== null &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as Error).message === 'string'
    );
}

/**
 * Get an error message safely from an unknown error
 */
export function getErrorMessage(error: unknown): string {
    if (isError(error)) {
        return error.message;
    }

    return String(error);
}

/**
 * Get an error stack safely from an unknown error
 */
export function getErrorStack(error: unknown): string | undefined {
    if (isError(error) && error.stack) {
        return error.stack;
    }

    return undefined;
}

/**
 * Format error for consistent logging
 */
export function formatError(error: unknown, operation: string): string {
    return `Error during ${operation}: ${getErrorMessage(error)}`;
}
