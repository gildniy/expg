import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors();
    
    // Set global prefix
    app.setGlobalPrefix('api/v1');
    
    // Set up global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Set up Swagger documentation
    setupSwagger(app);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    // Log application URLs
    const baseUrl = `http://localhost:${port}`;
    console.log(`Application is running on: ${baseUrl}/api/v1`);
    console.log(`Swagger documentation: ${baseUrl}/api/v1/docs`);
    console.log(`API Health check: ${baseUrl}/api/v1/health`);
}

bootstrap();
