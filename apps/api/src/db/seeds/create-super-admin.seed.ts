import { DataSource } from 'typeorm';
import { AccountStatus, User, UserRole } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Database seed function to create a super admin user
 * This should be run once during initial system setup
 */
export const createSuperAdmin = async (dataSource: DataSource): Promise<void> => {
  const userRepository = dataSource.getRepository(User);

  // Check if super admin already exists
  const existingSuperAdmin = await userRepository.findOne({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (existingSuperAdmin) {
    console.log('Super admin already exists. Skipping seed.');
    return;
  }

  // Get default super admin credentials from environment variables
  const email = process.env.SUPER_ADMIN_EMAIL || 'super-admin@example.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'superAdminPassword123';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create super admin user
  const superAdmin = userRepository.create({
    email,
    password: hashedPassword,
    name,
    role: UserRole.SUPER_ADMIN,
    status: AccountStatus.ACTIVE,
    metadata: {
      createdBy: 'system',
      isSystemUser: true,
    },
  });

  await userRepository.save(superAdmin);
  console.log(`Super admin created with email: ${email}`);
};
