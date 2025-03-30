import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger} from '@nestjs/common';
import {Request, Response} from 'express';
import {isError} from '@/config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_SERVER_ERROR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const exceptionObj = exceptionResponse as Record<string, any>;
                message = exceptionObj.message || message;
                errorCode = exceptionObj.error || this.getErrorCodeFromStatus(status);
            } else if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
        }

        // Log the exception details
        this.logger.error(
            `Request to ${request.method} ${request.url} failed with status ${status}: ${message}`,
            isError(exception) ? exception.stack : undefined,
        );

        // Send consistent error response
        response.status(status).json({
            status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            errorCode,
        });
    }

    private getErrorCodeFromStatus(status: number): string {
        const statusCodeMap: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_SERVER_ERROR',
            503: 'SERVICE_UNAVAILABLE',
        };

        return statusCodeMap[status] || 'UNKNOWN_ERROR';
    }
}
