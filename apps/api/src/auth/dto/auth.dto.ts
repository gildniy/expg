import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty, IsOptional, IsString, MinLength} from 'class-validator';

export class RegisterDto {
    @ApiProperty({example: 'user@example.com'})
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({example: 'securePassword123'})
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    password: string;

    @ApiProperty({example: 'John Doe'})
    @IsString()
    @IsOptional()
    name?: string;
}

export class LoginDto {
    @ApiProperty({example: 'user@example.com'})
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({example: 'securePassword123'})
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class JwtPayloadDto {
    @ApiProperty()
    sub: string;

    @ApiProperty()
    email: string;
}

export class LoginResponseDto {
    @ApiProperty({example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'})
    access_token: string;
    
    @ApiProperty({example: { id: '123', email: 'user@example.com', name: 'John Doe', role: 'CUSTOMER' }})
    user: {
        id: string;
        email: string;
        name?: string;
        role: string;
    };
}

export class UserProfileDto {
    @ApiProperty({example: '123'})
    id: string;
    
    @ApiProperty({example: 'user@example.com'})
    email: string;
    
    @ApiProperty({example: 'John Doe'})
    name?: string;
    
    @ApiProperty({example: 'CUSTOMER'})
    role: string;
    
    @ApiProperty({example: '2023-01-01T00:00:00.000Z'})
    createdAt: string;
}

export class RegisterResponseDto {
    @ApiProperty({example: '123'})
    id: string;
    
    @ApiProperty({example: 'user@example.com'})
    email: string;
    
    @ApiProperty({example: 'John Doe'})
    name?: string;
    
    @ApiProperty({example: 'CUSTOMER'})
    role: string;
}

export class AdminResponseDto {
    @ApiProperty({example: 'Admin access successful'})
    message: string;
}

export class MerchantResponseDto {
    @ApiProperty({example: 'Merchant access successful'})
    message: string;
}
