import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { VirtualAccount } from '../entities/virtual-account.entity';
import { Transaction } from '../entities/transaction.entity';
import { Point } from '../entities/point.entity';
import { createSuperAdmin } from './seeds/create-super-admin.seed';

// Load environment variables
config();

/**
 * Database connection configuration
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, VirtualAccount, Transaction, Point],
  synchronize: false,
});

/**
 * Main seed function that runs all seed scripts
 */
async function main() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Run seed functions
    await createSuperAdmin(AppDataSource);

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run the seed
main();
