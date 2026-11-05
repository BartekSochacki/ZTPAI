const HOUR = 60 * 60 * 1000;

function createSeedData(now = new Date()) {
  const startedAt = new Date(now.getTime() - 0.5 * HOUR);
  const created = new Date("2026-11-01T08:00:00Z");

  return {
    users: [
      { id: 1, email: "admin@example.com", password: "admin-password-123", role: "ADMIN", createdAt: created },
      { id: 2, email: "jan.kowalski@example.com", password: "jan-password-123", role: "USER", createdAt: created },
      { id: 3, email: "anna.nowak@example.com", password: "anna-password-123", role: "USER", createdAt: created },
      { id: 4, email: "piotr.zielinski@example.com", password: "piotr-password-123", role: "USER", createdAt: created }
    ],
    buildings: [
      { id: 1, name: "Budynek A", address: "ul. Warszawska 24, Kraków", createdAt: created },
      { id: 2, name: "Budynek B", address: "ul. Jana Pawła II 37, Kraków", createdAt: created }
    ],
    rooms: [
      { id: 1, buildingId: 1, name: "101", capacity: 30, createdAt: created },
      { id: 2, buildingId: 1, name: "102", capacity: 15, createdAt: created },
      { id: 3, buildingId: 1, name: "201", capacity: 50, createdAt: created },
      { id: 4, buildingId: 2, name: "101", capacity: 20, createdAt: created },
      { id: 5, buildingId: 2, name: "202", capacity: 8, createdAt: created }
    ],
    reservations: [
      {
        id: 1, roomId: 1, userId: 2, participants: 20,
        startTime: new Date("2026-11-20T10:00:00Z"), endTime: new Date("2026-11-20T12:00:00Z"),
        status: "CONFIRMED", createdAt: created, cancelledAt: null
      },
      {
        id: 2, roomId: 1, userId: 3, participants: 10,
        startTime: new Date("2026-11-20T12:00:00Z"), endTime: new Date("2026-11-20T13:00:00Z"),
        status: "CONFIRMED", createdAt: new Date("2026-11-01T09:00:00Z"), cancelledAt: null
      },
      {
        id: 3, roomId: 2, userId: 4, participants: 12,
        startTime: new Date("2026-11-21T09:00:00Z"), endTime: new Date("2026-11-21T11:00:00Z"),
        status: "CANCELLED", createdAt: new Date("2026-11-01T10:00:00Z"), cancelledAt: new Date("2026-11-03T12:00:00Z")
      },
      {
        id: 4, roomId: 3, userId: 2, participants: 40,
        startTime: startedAt, endTime: new Date(startedAt.getTime() + 2 * HOUR),
        status: "CONFIRMED", createdAt: new Date(startedAt.getTime() - 24 * HOUR), cancelledAt: null
      },
      {
        id: 5, roomId: 4, userId: 3, participants: 15,
        startTime: new Date("2026-11-25T14:00:00Z"), endTime: new Date("2026-11-25T16:00:00Z"),
        status: "CONFIRMED", createdAt: new Date("2026-11-02T08:00:00Z"), cancelledAt: null
      }
    ]
  };
}

module.exports = { createSeedData };
