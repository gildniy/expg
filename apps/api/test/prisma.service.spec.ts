import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/services/prisma.service';
import { createClient } from '@supabase/supabase-js';

// Mock the PrismaClient methods
jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  }));
  return { PrismaClient: mockPrismaClient };
});

// Mock the Supabase createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({ from: jest.fn() }),
}));

describe('PrismaService', () => {
  let service: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to the database', async () => {
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      jest.spyOn(service, '$connect').mockRejectedValueOnce(new Error('Connection error'));
      await expect(service.onModuleInit()).rejects.toThrow('Connection error');
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from the database', async () => {
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Supabase integration', () => {
    describe('when Supabase credentials are provided', () => {
      beforeEach(() => {
        jest.spyOn(configService, 'get').mockImplementation((key) => {
          if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
          if (key === 'SUPABASE_ANON_KEY') return 'test-key';
          return null;
        });
      });

      it('should initialize Supabase client', () => {
        // Instantiate a new service to trigger the constructor
        const newService = new PrismaService(configService);
        
        expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-key');
        expect(newService.hasSupabaseClient()).toBe(true);
      });

      it('should return Supabase client when getSupabase is called', () => {
        // Mock the private supabase property
        Object.defineProperty(service, 'supabase', {
          value: { from: jest.fn() },
          writable: true,
        });

        const supabase = service.getSupabase();
        expect(supabase).toBeDefined();
        expect(supabase.from).toBeDefined();
      });
    });

    describe('when Supabase credentials are missing', () => {
      beforeEach(() => {
        jest.spyOn(configService, 'get').mockReturnValue(null);
      });

      it('should not initialize Supabase client', () => {
        // Instantiate a new service to trigger the constructor
        const newService = new PrismaService(configService);
        
        expect(newService.hasSupabaseClient()).toBe(false);
      });

      it('should throw error when getSupabase is called', () => {
        // Ensure the supabase property is undefined
        Object.defineProperty(service, 'supabase', {
          value: undefined,
          writable: true,
        });

        expect(() => service.getSupabase()).toThrow(
          'Supabase client not initialized. Check your environment variables.'
        );
      });
    });
  });
}); 