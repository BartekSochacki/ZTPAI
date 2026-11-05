const { z } = require("zod");

const email = z.string().trim().toLowerCase().pipe(z.email({ error: "Invalid email address" }));

const registerBody = z.object({
  email,
  password: z.string()
    .min(10, "Password must be at least 10 characters long")
    .max(72, "Password must be at most 72 characters long")
}).strict();

const loginBody = z.object({
  email,
  password: z.string().min(1).max(200)
}).strict();

module.exports = { registerBody, loginBody };
