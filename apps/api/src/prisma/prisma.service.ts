import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {PrismaClient} from '@prisma/client';

// Add types for Prisma log events
type LogEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};

// Add types for the beforeExit event
type BeforeExitEvent = {
    name: string;
};

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                {emit: 'event', level: 'query'},
                {emit: 'stdout', level: 'info'},
                {emit: 'stdout', level: 'warn'},
                {emit: 'stdout', level: 'error'},
            ],
        });
    }

    async onModuleInit() {
        this.logger.log('Connecting to the database...');
        await this.$connect();
        this.logger.log('Connected to the database');

        // Setup logging if in development mode
        if (process.env.NODE_ENV !== 'production') {
            // Type assertion to access the $on method
            (this as any).$on('query', (e: any) => {
                this.logger.debug(`Query: ${e.query}`);
                this.logger.debug(`Duration: ${e.duration}ms`);
            });
        }
    }

    async onModuleDestroy() {
        this.logger.log('Disconnecting from the database...');
        await this.$disconnect();
        this.logger.log('Disconnected from the database');
    }

    // Helper for enabling shutdown hooks with Nest
    async enableShutdownHooks(app: any) {
        // Type assertion to access the $on method
        (this as any).$on('beforeExit', async () => {
            this.logger.log('PrismaClient beforeExit hook, closing application...');
            await app.close();
        });
    }

    // // Helper for transactions
    // async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    //     return this.$transaction(fn);
    // }
}
