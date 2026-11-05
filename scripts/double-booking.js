const { createKnex } = require("../src/db/knex");

const API_URL = "http://localhost:3000";
const REQUESTS = 10;
const credentials = { email: "jan.kowalski@example.com", password: "jan-password-123" };
const body = {
  roomId: 2,
  participants: 5,
  startTime: "2026-12-01T10:00:00Z",
  endTime: "2026-12-01T12:00:00Z"
};

async function login() {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  return (await res.json()).accessToken;
}

async function sendReservation(i, token) {
  const res = await fetch(`${API_URL}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return { i, status: res.status, info: json.id ? `id=${json.id}` : json.error?.code };
}

async function main() {
  const token = await login();
  const results = await Promise.all(Array.from({ length: REQUESTS }, (_, i) => sendReservation(i + 1, token)));
  for (const r of results) {
    console.log(`request ${String(r.i).padStart(2)}: ${r.status} ${r.info}`);
  }

  const counts = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  console.log("statusy:", counts);

  const knex = createKnex();
  const [{ count }] = await knex("reservations")
    .where({ room_id: body.roomId, status: "CONFIRMED" })
    .where("start_time", "<", body.endTime)
    .where("end_time", ">", body.startTime)
    .count("id as count");
  console.log(`rezerwacje CONFIRMED w bazie dla sali ${body.roomId} i tego przedzialu: ${count}`);
  await knex.destroy();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
