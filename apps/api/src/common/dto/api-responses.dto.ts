import {ApiProperty} from '@nestjs/swagger';

/**
 * Standard error response DTO for API error responses
 * Used for consistent error format across the API
 */
export class ApiErrorResponseDto {
    @ApiProperty({example: 400})
    status: number;

    @ApiProperty({example: '2023-04-01T12:00:00.000Z'})
    timestamp: string;

    @ApiProperty({example: '/api/v1/auth/login'})
    path: string;

    @ApiProperty({example: 'POST'})
    method: string;

    @ApiProperty({example: 'Invalid credentials'})
    message: string;

    @ApiProperty({example: 'UNAUTHORIZED'})
    errorCode: string;
}

/**
 * DTO for 400 Bad Request responses
 */
export class BadRequestResponseDto extends ApiErrorResponseDto {
    @ApiProperty({example: 400})
    status: number;

    @ApiProperty({example: 'BAD_REQUEST'})
    errorCode: string;

    @ApiProperty({example: 'Invalid input data'})
    message: string;
}

/**
 * DTO for 401 Unauthorized responses
 */
export class UnauthorizedResponseDto extends ApiErrorResponseDto {
    @ApiProperty({example: 401})
    status: number;

    @ApiProperty({example: 'UNAUTHORIZED'})
    errorCode: string;

    @ApiProperty({example: 'Invalid credentials'})
    message: string;
}

/**
 * DTO for 403 Forbidden responses
 */
export class ForbiddenResponseDto extends ApiErrorResponseDto {
    @ApiProperty({example: 403})
    status: number;

    @ApiProperty({example: 'FORBIDDEN'})
    errorCode: string;

    @ApiProperty({example: 'Access forbidden'})
    message: string;
}

/**
 * DTO for 404 Not Found responses
 */
export class NotFoundResponseDto extends ApiErrorResponseDto {
    @ApiProperty({example: 404})
    status: number;

    @ApiProperty({example: 'NOT_FOUND'})
    errorCode: string;

    @ApiProperty({example: 'Resource not found'})
    message: string;
}

/**
 * DTO for 409 Conflict responses
 */
export class ConflictResponseDto extends ApiErrorResponseDto {
    @ApiProperty({example: 409})
    status: number;

    @ApiProperty({example: 'CONFLICT'})
    errorCode: string;

    @ApiProperty({example: 'Email already in use'})
    message: string;
}

/**
 * DTO for 500 Internal Server Error responses
 */
export class InternalServerErrorResponseDto extends ApiErrorResponseDto {
    @ApiProperty({example: 500})
    status: number;

    @ApiProperty({example: 'INTERNAL_SERVER_ERROR'})
    errorCode: string;

    @ApiProperty({example: 'Internal server error'})
    message: string;
} 