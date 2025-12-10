/**
 * Type-safe error message extraction utility
 * Use this instead of (error: any) for proper TypeScript safety
 */

interface ErrorWithMessage {
  message: string;
}

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
}

/**
 * Type guard to check if an unknown value is an Error with a message
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Gets error message with a fallback
 */
export function getErrorMessageWithFallback(error: unknown, fallback: string): string {
  if (isErrorWithMessage(error)) {
    return error.message || fallback;
  }
  return fallback;
}

/**
 * Checks if error has a statusCode property
 */
export function hasStatusCode(error: unknown): error is ErrorWithStatusCode {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as ErrorWithStatusCode).statusCode === 'number'
  );
}

/**
 * Gets the status code from an error if present
 */
export function getErrorStatusCode(error: unknown, defaultCode: number = 500): number {
  if (hasStatusCode(error) && error.statusCode) {
    return error.statusCode;
  }
  return defaultCode;
}
