import {Controller, Get} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ApiProperty} from '@nestjs/swagger';
import {InternalServerErrorResponseDto} from '@/common';

export class HealthResponseDto {
    @ApiProperty({example: 'ok'})
    status: string;

    @ApiProperty({example: 'EZPG Merchant API is running'})
    message: string;

    @ApiProperty({example: '2023-04-01T12:00:00.000Z'})
    timestamp: string;

    @ApiProperty({example: '1.0'})
    version: string;
}

@ApiTags('health')
@Controller()
export class AppController {
    @Get()
    @ApiOperation({summary: 'Health check endpoint'})
    @ApiResponse({status: 200, description: 'API is working', type: HealthResponseDto})
    @ApiResponse({status: 500, description: 'Server error', type: InternalServerErrorResponseDto})
    getHealth() {
        return {
            status: 'ok',
            message: 'EZPG Merchant API is running',
            timestamp: new Date().toISOString(),
            version: '1.0',
        };
    }
}
