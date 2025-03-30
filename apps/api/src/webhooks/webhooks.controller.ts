import {Body, Controller, HttpStatus, Logger, Post, Res} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {WebhooksService} from './webhooks.service';
import {EzpgDepositNotificationDto, EzpgWithdrawalNotificationDto} from './dto/webhook.dto';
import {ApiProperty} from '@nestjs/swagger';
import {BadRequestResponseDto} from '@/common';

export class WebhookResponseDto {
    @ApiProperty({example: '0000', description: 'Response code indicating success or failure'})
    code: string;
}

@ApiTags('webhooks')
@Controller('webhooks/ezpg')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private readonly webhooksService: WebhooksService) {
    }

    @Post('deposit-notification')
    @ApiOperation({summary: 'Receive deposit notification from EZPG'})
    @ApiResponse({status: 200, description: 'Notification processed successfully', type: WebhookResponseDto})
    @ApiResponse({status: 400, description: 'Bad request', type: BadRequestResponseDto})
    async handleDepositNotification(
        @Body() notification: EzpgDepositNotificationDto,
        @Res() res: Response,
    ) {
        try {
            const result = await this.webhooksService.handleDepositNotification(notification);
            // EZPG requires plain text response with "0000" for success
            res.status(HttpStatus.OK).send(result);
        } catch (error: any) {
            this.logger.error(`Error handling deposit notification: ${error?.message || 'Unknown error'}`, error?.stack);
            // EZPG might retry on failure, so we return a specific error code
            res.status(HttpStatus.BAD_REQUEST).send('9999');  // Custom error code
        }
    }

    @Post('withdrawal-notification')
    @ApiOperation({summary: 'Receive withdrawal notification from EZPG'})
    @ApiResponse({status: 200, description: 'Notification processed successfully', type: WebhookResponseDto})
    @ApiResponse({status: 400, description: 'Bad request', type: BadRequestResponseDto})
    async handleWithdrawalNotification(
        @Body() notification: EzpgWithdrawalNotificationDto,
        @Res() res: Response,
    ) {
        try {
            const result = await this.webhooksService.handleWithdrawalNotification(notification);
            // EZPG requires plain text response with "0000" for success
            res.status(HttpStatus.OK).send(result);
        } catch (error: any) {
            this.logger.error(`Error handling withdrawal notification: ${error?.message || 'Unknown error'}`, error?.stack);
            // EZPG might retry on failure, so we return a specific error code
            res.status(HttpStatus.BAD_REQUEST).send('9999');  // Custom error code
        }
    }
}
