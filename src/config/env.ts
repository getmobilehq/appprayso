/**
 * Environment variable validation and type-safe access
 * Ensures all required environment variables are present at runtime
 */

interface EnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_LIVEKIT_URL: string;
  VITE_API_BASE_URL?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Validate that a required environment variable exists
 */
function requireEnv(key: string): string {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please check your .env file and ensure ${key} is set.\n` +
      `See .env.example for reference.`
    );
  }

  return value;
}

/**
 * Validate URL format
 */
function validateUrl(url: string, name: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(
      `Invalid URL format for ${name}: ${url}\n` +
      `Please provide a valid URL (e.g., https://example.com)`
    );
  }
}

/**
 * Validate and parse environment variables
 */
function validateEnv(): EnvVars {
  // Required variables
  const VITE_SUPABASE_URL = requireEnv('VITE_SUPABASE_URL');
  const VITE_SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY');
  const VITE_LIVEKIT_URL = requireEnv('VITE_LIVEKIT_URL');

  // Validate URL formats
  validateUrl(VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
  validateUrl(VITE_LIVEKIT_URL, 'VITE_LIVEKIT_URL');

  // Validate Supabase key format
  if (VITE_SUPABASE_ANON_KEY.length < 20) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY appears to be invalid (too short).\n' +
      'Please check your Supabase project settings.'
    );
  }

  // Optional variables
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Node environment
  const NODE_ENV = (import.meta.env.MODE || 'development') as EnvVars['NODE_ENV'];

  return {
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY,
    VITE_LIVEKIT_URL,
    VITE_API_BASE_URL,
    NODE_ENV,
  };
}

/**
 * Validated and type-safe environment variables
 * Will throw an error at startup if required variables are missing
 */
export const env = validateEnv();

/**
 * Helper to check if running in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if running in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if running in test mode
 */
export const isTest = env.NODE_ENV === 'test';
