const dotenv = require('dotenv');
const { z } = require('zod');
dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
    GROQ_API_KEY: z.string().optional()
})


const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}

module.exports = _env.data;