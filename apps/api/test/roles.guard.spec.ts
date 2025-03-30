import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';
import { ROLES_KEY } from '../src/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({
        user: {
          id: '1',
          role: UserRole.ADMIN,
        },
      })),
    })),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true when user has one of multiple required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.CUSTOMER, UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
