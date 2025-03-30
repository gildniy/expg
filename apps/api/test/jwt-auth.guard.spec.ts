import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';

// Mock the AuthGuard from @nestjs/passport
jest.mock('@nestjs/passport', () => {
  class MockAuthGuard {
    canActivate() {
      return true;
    }
  }

  return {
    AuthGuard: jest.fn().mockImplementation(() => {
      return MockAuthGuard;
    }),
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should call canActivate and return true', async () => {
    const mockContext = {} as ExecutionContext;
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
