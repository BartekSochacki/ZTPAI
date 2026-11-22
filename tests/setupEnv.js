require("dotenv").config({ quiet: true });

function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) return "postgres://postgres:postgres@localhost:5432/roombooking_test";

  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname.slice(1)}_test`;
  return url.toString();
}

const databaseUrl = testDatabaseUrl();
if (!new URL(databaseUrl).pathname.endsWith("_test")) {
  throw new Error(`Tests must use a separate *_test database, got: ${new URL(databaseUrl).pathname.slice(1)}`);
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = databaseUrl;
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.JWT_EXPIRES_IN = "15m";
process.env.BCRYPT_COST = "10";
