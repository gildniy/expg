import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = this.configService.get<string>('ALLOWED_ORIGINS').split(',');
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Accept, Authorization, X-API-Key',
      );

      if (this.configService.get<boolean>('CORS_CREDENTIALS')) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
}
