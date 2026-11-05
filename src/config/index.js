require("dotenv").config({ quiet: true });
const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "DATABASE_URL must be a postgres:// URL" }),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, "JWT_EXPIRES_IN must look like 15m, 10s, 1h or 7d").default("15m"),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12)
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid configuration, the application will not start:");
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join(".") || "env"}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = Object.freeze(result.data);
