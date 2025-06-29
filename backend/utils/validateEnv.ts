import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3003),
  
  // Database
  DB_PATH: z.string().optional(),
  
  // Blockchain
  ZCORP_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid private key format'),
  ZCORP_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address format'),
  RPC_URL: z.string().url('Invalid RPC URL'),
  CHAIN_ID: z.string().transform(Number).default(8453),
  
  // API
  FRONTEND_URL: z.string().url('Invalid frontend URL').default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional security checks
    if (env.NODE_ENV === 'production') {
      // In production, require stronger validation
      if (env.ZCORP_PRIVATE_KEY.includes('demo') || env.ZCORP_PRIVATE_KEY.includes('test')) {
        throw new Error('Demo/test private keys are not allowed in production');
      }
      
      if (env.FRONTEND_URL.includes('localhost') || env.FRONTEND_URL.includes('127.0.0.1')) {
        console.warn('⚠️  Warning: Using localhost frontend URL in production');
      }
    }
    
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    
    console.error('\n📝 Required environment variables:');
    console.error('  • ZCORP_PRIVATE_KEY: Private key for ZCORP wallet (0x...)');
    console.error('  • ZCORP_TOKEN_ADDRESS: Address of ZCORP token (0x...)');
    console.error('  • RPC_URL: Blockchain RPC endpoint URL');
    console.error('  • FRONTEND_URL: Frontend application URL');
    
    process.exit(1);
  }
}

// Helper to get validated environment variables
export const env = validateEnv();