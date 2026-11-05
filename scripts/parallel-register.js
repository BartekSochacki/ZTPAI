const API_URL = "http://localhost:3000";
const REQUESTS = 10;

async function register(i) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: i % 2 ? "Rownolegly@Example.com" : "rownolegly@example.com", password: "bardzo-dlugie-haslo" })
  });
  const json = await res.json();
  return { i, status: res.status, info: json.id ? `id=${json.id} ${json.email}` : json.error?.code };
}

async function main() {
  const results = await Promise.all(Array.from({ length: REQUESTS }, (_, i) => register(i + 1)));
  for (const r of results) console.log(`request ${String(r.i).padStart(2)}: ${r.status} ${r.info}`);
  const counts = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  console.log("statusy:", counts);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
