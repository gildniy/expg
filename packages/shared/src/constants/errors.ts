export enum ErrorCode {
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    VIRTUAL_ACCOUNT_ERROR = 'VIRTUAL_ACCOUNT_ERROR',
    TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  }
  
  export const ERROR_MESSAGES = {
    [ErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource',
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
    [ErrorCode.VALIDATION_ERROR]: 'The provided data is invalid',
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
    [ErrorCode.VIRTUAL_ACCOUNT_ERROR]: 'Failed to create or update virtual account',
    [ErrorCode.TRANSACTION_ERROR]: 'Failed to process the transaction',
  };