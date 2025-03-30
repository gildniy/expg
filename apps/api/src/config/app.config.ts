/**
 * Application configuration
 */
export const AppConfig = {
    port: process.env.PORT || 3001,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    jwt: {
        secret: process.env.JWT_SECRET || 'development-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    ezpg: {
        merchantId: process.env.EZPG_MERCHANT_ID || '',
        merchantKey: process.env.EZPG_MERCHANT_KEY || '',
        apiBaseUrl: process.env.EZPG_API_BASE_URL || 'https://api.ez-pg.com',
    },
    database: {
        url: process.env.DATABASE_URL,
    }
};

/**
 * Validates that all required environment variables are set
 */
export function validateEnvironment(): void {
    const requiredVars = [
        {name: 'JWT_SECRET', value: AppConfig.jwt.secret, defaultValue: 'development-secret-key'},
        {name: 'EZPG_MERCHANT_ID', value: AppConfig.ezpg.merchantId},
        {name: 'EZPG_MERCHANT_KEY', value: AppConfig.ezpg.merchantKey},
        {name: 'DATABASE_URL', value: AppConfig.database.url},
    ];

    const missingVars = requiredVars
        .filter(v => !v.value || v.value === v.defaultValue)
        .map(v => v.name);

    if (missingVars.length > 0) {
        console.warn(`Warning: The following environment variables are missing or using default values: ${missingVars.join(', ')}`);

        if (process.env.NODE_ENV === 'production' && missingVars.some(v => v !== 'JWT_SECRET')) {
            throw new Error(`Missing required environment variables for production: ${missingVars.join(', ')}`);
        }
    }
}
