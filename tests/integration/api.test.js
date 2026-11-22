const request = require("supertest");
const bcrypt = require("bcryptjs");
const config = require("../../src/config");
const { createApp } = require("../../src/app");
const { createKnex } = require("../../src/db/knex");
const { createKnexUnitOfWork } = require("../../src/db/unit-of-work.knex");
const { createEventBus } = require("../../src/events/eventBus");
const { registerAuditListeners } = require("../../src/events/auditListeners");

const db = createKnex();
const unitOfWork = createKnexUnitOfWork(db);
const eventBus = createEventBus();
registerAuditListeners(eventBus, unitOfWork.repositories.auditLogRepository);
const app = createApp({ ...unitOfWork, config, eventBus, now: () => new Date() });

const PASSWORD = "password-123456";
const day = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const at = time => `${day}T${time}:00Z`;
const booking = (from, to, extra = {}) => ({ roomId: 1, participants: 10, startTime: at(from), endTime: at(to), ...extra });

async function registerAndLogin(email) {
  await request(app).post("/api/auth/register").send({ email, password: PASSWORD }).expect(201);
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD }).expect(200);
  return res.body.accessToken;
}

async function createAdminAndLogin() {
  await db("users").insert({ email: "admin@example.com", password_hash: await bcrypt.hash(PASSWORD, 10), role: "ADMIN" });
  const res = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: PASSWORD }).expect(200);
  return res.body.accessToken;
}

const auth = token => ({ Authorization: `Bearer ${token}` });

async function waitFor(check) {
  for (let i = 0; i < 50; i++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error("condition not met in time");
}

beforeAll(async () => {
  await db.migrate.latest();
});

beforeEach(async () => {
  await db.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE");
  await db("buildings").insert({ name: "Budynek A", address: "ul. Warszawska 24, Kraków" });
  await db("rooms").insert([
    { building_id: 1, name: "101", capacity: 30 },
    { building_id: 1, name: "102", capacity: 15 }
  ]);
});

afterAll(async () => {
  await db.destroy();
});

describe("Auth", () => {
  test("register + login + GET /api/auth/me", async () => {
    const token = await registerAndLogin("Jan.Kowalski@Example.com");

    const res = await request(app).get("/api/auth/me").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "jan.kowalski@example.com", role: "USER" });
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  test("401 without token", async () => {
    const res = await request(app).get("/api/reservations");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Reservations API", () => {
  test("POST /api/reservations returns 201, Location header and persists the row", async () => {
    const token = await registerAndLogin("jan@example.com");

    const res = await request(app).post("/api/reservations").set(auth(token)).send(booking("10:00", "12:00"));

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/reservations/${res.body.id}`);
    const row = await db("reservations").where({ id: res.body.id }).first();
    expect(row).toMatchObject({ room_id: 1, participants: 10, status: "CONFIRMED" });
    expect(row.start_time.toISOString()).toBe(at("10:00").replace("Z", ".000Z"));
  });

  test("400 with field details for an invalid body", async () => {
    const token = await registerAndLogin("jan@example.com");

    const res = await request(app)
      .post("/api/reservations")
      .set(auth(token))
      .send({ roomId: 0, participants: 5, startTime: "jutro", endTime: at("12:00"), status: "CONFIRMED" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ location: "body", field: "roomId" }),
      expect.objectContaining({ location: "body", field: "startTime" }),
      expect.objectContaining({ location: "body", field: "", message: expect.stringContaining("status") })
    ]));
  });

  test("403 when a USER tries to create a room", async () => {
    const token = await registerAndLogin("jan@example.com");

    const res = await request(app).post("/api/rooms").set(auth(token)).send({ buildingId: 1, name: "301", capacity: 20 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("404 when a USER fetches someone else's reservation", async () => {
    const janToken = await registerAndLogin("jan@example.com");
    const annaToken = await registerAndLogin("anna@example.com");
    const { body: created } = await request(app).post("/api/reservations").set(auth(janToken)).send(booking("10:00", "12:00")).expect(201);

    const res = await request(app).get(`/api/reservations/${created.id}`).set(auth(annaToken));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  test("409 ROOM_ALREADY_BOOKED for an overlapping reservation", async () => {
    const janToken = await registerAndLogin("jan@example.com");
    const annaToken = await registerAndLogin("anna@example.com");
    await request(app).post("/api/reservations").set(auth(janToken)).send(booking("10:00", "12:00")).expect(201);

    const res = await request(app).post("/api/reservations").set(auth(annaToken)).send(booking("11:00", "13:00"));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ROOM_ALREADY_BOOKED");
    expect(await db("reservations").count("id as n").first()).toEqual({ n: "1" });
  });

  test("pagination returns meta.total and limit items in data", async () => {
    const token = await registerAndLogin("jan@example.com");
    for (const [from, to] of [["08:00", "09:00"], ["10:00", "11:00"], ["12:00", "13:00"]]) {
      await request(app).post("/api/reservations").set(auth(token)).send(booking(from, to)).expect(201);
    }

    const res = await request(app).get("/api/reservations?limit=2&page=1").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });
});

describe("Audit log", () => {
  test("ADMIN sees events in GET /api/admin/audit-log, USER gets 403", async () => {
    const janToken = await registerAndLogin("jan@example.com");
    const adminToken = await createAdminAndLogin();
    const { body: created } = await request(app).post("/api/reservations").set(auth(janToken)).send(booking("10:00", "12:00")).expect(201);
    await request(app).patch(`/api/reservations/${created.id}/cancel`).set(auth(adminToken)).expect(200);
    await waitFor(async () => (await db("audit_log").count("id as n").first()).n === "2");

    await request(app).get("/api/admin/audit-log").set(auth(janToken)).expect(403);
    const res = await request(app).get("/api/admin/audit-log?eventType=reservation.cancelled").set(auth(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      eventType: "reservation.cancelled",
      payload: { reservationId: created.id, roomId: 1, userId: 1, cancelledBy: 2 }
    });
  });
});
