const { createReservationsService } = require("../../src/modules/reservations/reservations.service");
const { createUsersRepository } = require("../../src/modules/users/users.repository.memory");
const { createRoomsRepository } = require("../../src/modules/rooms/rooms.repository.memory");
const { createReservationsRepository } = require("../../src/modules/reservations/reservations.repository.memory");

const admin = { id: 1, role: "ADMIN" };
const owner = { id: 2, role: "USER" };
const otherUser = { id: 3, role: "USER" };

const NOW = new Date("2026-12-01T08:00:00Z");
const at = time => `2026-12-10T${time}:00Z`;

const reservation = (id, roomId, from, to, extra = {}) => ({
  id,
  roomId,
  userId: owner.id,
  participants: 10,
  startTime: new Date(at(from)),
  endTime: new Date(at(to)),
  status: "CONFIRMED",
  createdAt: NOW,
  cancelledAt: null,
  ...extra
});

function setup({ reservations = [], now = () => NOW } = {}) {
  const db = {
    users: [
      { id: admin.id, email: "admin@example.com", passwordHash: "x", role: "ADMIN" },
      { id: owner.id, email: "jan@example.com", passwordHash: "x", role: "USER" },
      { id: otherUser.id, email: "anna@example.com", passwordHash: "x", role: "USER" }
    ],
    buildings: [{ id: 1, name: "Budynek A", address: "ul. Warszawska 24" }],
    rooms: [
      { id: 1, buildingId: 1, name: "101", capacity: 30 },
      { id: 2, buildingId: 1, name: "102", capacity: 15 }
    ],
    reservations: structuredClone(reservations)
  };
  const repositories = {
    usersRepository: createUsersRepository(db),
    roomsRepository: createRoomsRepository(db),
    reservationsRepository: createReservationsRepository(db)
  };
  const eventBus = { publish: jest.fn(), subscribe: jest.fn() };
  const service = createReservationsService({
    ...repositories,
    runInTransaction: work => work(repositories),
    eventBus,
    now
  });
  return { service, eventBus, db };
}

const booking = (from, to, extra = {}) => ({
  roomId: 1,
  participants: 10,
  startTime: at(from),
  endTime: at(to),
  ...extra
});

describe("reservationsService.createReservation - overlapping", () => {
  const existing = [reservation(1, 1, "10:00", "12:00")];

  test.each([
    ["11:00", "13:00", "partial overlap at the end"],
    ["09:00", "11:00", "partial overlap at the start"],
    ["09:00", "13:00", "contains the existing reservation"],
    ["10:30", "11:00", "is contained in the existing reservation"]
  ])("rejects %s-%s (%s)", async (from, to) => {
    const { service } = setup({ reservations: existing });
    await expect(service.createReservation(booking(from, to), owner))
      .rejects.toMatchObject({ statusCode: 409, code: "ROOM_ALREADY_BOOKED" });
  });

  test.each([
    ["12:00", "13:00"],
    ["08:00", "10:00"]
  ])("allows touching interval %s-%s", async (from, to) => {
    const { service } = setup({ reservations: existing });
    await expect(service.createReservation(booking(from, to), owner))
      .resolves.toMatchObject({ status: "CONFIRMED", roomId: 1 });
  });

  test("allows the same interval in another room", async () => {
    const { service } = setup({ reservations: existing });
    await expect(service.createReservation(booking("10:00", "12:00", { roomId: 2 }), owner))
      .resolves.toMatchObject({ roomId: 2, status: "CONFIRMED" });
  });

  test("CANCELLED reservation does not block the interval", async () => {
    const { service } = setup({
      reservations: [reservation(1, 1, "10:00", "12:00", { status: "CANCELLED", cancelledAt: NOW })]
    });
    await expect(service.createReservation(booking("10:00", "12:00"), owner))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });
});

describe("reservationsService.createReservation - capacity and duration", () => {
  test("allows participants equal to capacity", async () => {
    const { service } = setup();
    await expect(service.createReservation(booking("10:00", "11:00", { participants: 30 }), owner))
      .resolves.toMatchObject({ participants: 30 });
  });

  test("rejects capacity + 1 participants", async () => {
    const { service } = setup();
    await expect(service.createReservation(booking("10:00", "11:00", { participants: 31 }), owner))
      .rejects.toMatchObject({ statusCode: 409, code: "ROOM_CAPACITY_EXCEEDED" });
  });

  test.each([
    ["10:00", "10:15", "exactly 15 minutes"],
    ["08:00", "16:00", "exactly 8 hours"]
  ])("allows %s-%s (%s)", async (from, to) => {
    const { service } = setup();
    await expect(service.createReservation(booking(from, to), owner))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });

  test.each([
    ["10:00", "10:14", "14 minutes"],
    ["08:00", "16:01", "8 hours 1 minute"]
  ])("rejects %s-%s (%s)", async (from, to) => {
    const { service } = setup();
    await expect(service.createReservation(booking(from, to), owner))
      .rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  test("rejects startTime in the past", async () => {
    const { service } = setup({ now: () => new Date(at("11:00")) });
    await expect(service.createReservation(booking("10:00", "12:00"), owner))
      .rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });
});

describe("reservationsService.cancelReservation", () => {
  test("rejects cancelling a reservation that has already started", async () => {
    const { service } = setup({
      reservations: [reservation(1, 1, "10:00", "12:00")],
      now: () => new Date(at("10:00"))
    });
    await expect(service.cancelReservation(1, owner))
      .rejects.toMatchObject({ statusCode: 409, code: "RESERVATION_ALREADY_STARTED" });
  });

  test("double cancel is idempotent and keeps the first cancelledAt", async () => {
    let current = NOW;
    const { service } = setup({ reservations: [reservation(1, 1, "10:00", "12:00")], now: () => current });

    const first = await service.cancelReservation(1, owner);
    current = new Date("2026-12-02T09:30:00Z");
    const second = await service.cancelReservation(1, owner);

    expect(first).toMatchObject({ status: "CANCELLED", cancelledAt: NOW });
    expect(second.status).toBe("CANCELLED");
    expect(second.cancelledAt).toEqual(NOW);
  });

  test("another USER cannot cancel someone else's reservation", async () => {
    const { service } = setup({ reservations: [reservation(1, 1, "10:00", "12:00")] });
    await expect(service.cancelReservation(1, otherUser))
      .rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  test("ADMIN can cancel someone else's reservation", async () => {
    const { service } = setup({ reservations: [reservation(1, 1, "10:00", "12:00")] });
    await expect(service.cancelReservation(1, admin))
      .resolves.toMatchObject({ status: "CANCELLED", userId: owner.id });
  });
});

describe("reservationsService events", () => {
  test("publishes reservation.created after a successful create", async () => {
    const { service, eventBus } = setup();
    const created = await service.createReservation(booking("10:00", "12:00"), owner);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.created", {
      reservationId: created.id,
      roomId: 1,
      userId: owner.id,
      startTime: "2026-12-10T10:00:00.000Z",
      endTime: "2026-12-10T12:00:00.000Z"
    });
  });

  test("does not publish when the reservation collides (409)", async () => {
    const { service, eventBus } = setup({ reservations: [reservation(1, 1, "10:00", "12:00")] });
    await expect(service.createReservation(booking("11:00", "13:00"), owner)).rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  test("publishes reservation.cancelled once and not for the idempotent second cancel", async () => {
    const { service, eventBus } = setup({ reservations: [reservation(1, 1, "10:00", "12:00")] });

    await service.cancelReservation(1, admin);
    await service.cancelReservation(1, admin);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.cancelled", {
      reservationId: 1,
      roomId: 1,
      userId: owner.id,
      cancelledBy: admin.id
    });
  });

  test("does not publish when cancelling fails", async () => {
    const { service, eventBus } = setup({
      reservations: [reservation(1, 1, "10:00", "12:00")],
      now: () => new Date(at("11:00"))
    });
    await expect(service.cancelReservation(1, owner)).rejects.toMatchObject({ code: "RESERVATION_ALREADY_STARTED" });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
