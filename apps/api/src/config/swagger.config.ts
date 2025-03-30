import {INestApplication} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';

/**
 * Utility type for defining API response examples
 */
export interface ApiResponseOptions {
    example: never;
    description?: string;
}

/**
 * Utility function to create API response examples for use with @ApiProperty decorator
 * @param options - The response options including example and description
 * @returns Configuration object for ApiProperty decorator
 */
export function createApiResponse(options: ApiResponseOptions) {
    return {
        example: options.example,
        description: options.description || '',
    };
}

/**
 * Sets up Swagger documentation for the API
 * @param app - The NestJS application instance
 */
export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('EZPG Payment API')
        .setDescription(`
Payment integration API for virtual accounts and point system management.

## Quick Links
- [API Status](http://localhost:3001/api/v1/health)
- [Support](mailto:support@ez-pg.com)

## Authentication
Bearer Token required for all endpoints except health check.
Get your token at \`POST /auth/login\`
        `)
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('customer', 'Customer endpoints')
        .addTag('merchant', 'Merchant endpoints')
        .addTag('webhooks', 'Payment webhooks')
        .addTag('health', 'Health check')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/v1/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            filter: true,
        },
        customCss: '.swagger-ui .topbar { display: none }',
    });
}
