import type { Config } from 'drizzle-kit';
import baseConfig from './drizzle.config.ts';

export default {
  ...baseConfig,
  out: './.drizzle-generated',
} satisfies Config;
