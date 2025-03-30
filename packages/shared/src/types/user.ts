export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    MERCHANT = 'MERCHANT',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
  }
  
  export enum AccountStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
  }
  
  export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    status: AccountStatus;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserProfile extends Omit<User, 'password'> {}
  
  export interface UserRequest {
    id: string;
    email: string;
    role: UserRole;
  }