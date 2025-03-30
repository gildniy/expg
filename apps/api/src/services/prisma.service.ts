import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
    
    // Initialize Supabase client
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase URL or key not provided. Supabase client will not be initialized.');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized successfully');
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('PrismaClient connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('PrismaClient disconnected from the database');
  }

  // Get Supabase client for additional functionality
  getSupabase(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    return this.supabase;
  }

  // Check if Supabase client is initialized
  hasSupabaseClient(): boolean {
    return !!this.supabase;
  }
}
