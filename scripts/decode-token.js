const [token] = process.argv.slice(2);

if (!token) {
  console.error("usage: node scripts/decode-token.js <jwt>");
  process.exit(1);
}

const [header, payload] = token.split(".").slice(0, 2).map(part => JSON.parse(Buffer.from(part, "base64url").toString("utf8")));

console.log("header: ", JSON.stringify(header));
console.log("payload:", JSON.stringify(payload, null, 2));
console.log("iat:    ", new Date(payload.iat * 1000).toISOString());
console.log("exp:    ", new Date(payload.exp * 1000).toISOString(), `(${(payload.exp - payload.iat) / 60} min)`);
