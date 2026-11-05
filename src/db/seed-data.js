const HOUR = 60 * 60 * 1000;

function createSeedData(now = new Date()) {
  const startedAt = new Date(now.getTime() - 0.5 * HOUR);

  return {
    buildings: [
      { id: 1, name: "Budynek A", address: "ul. Warszawska 24, Kraków", createdAt: new Date("2026-11-01T08:00:00Z") },
      { id: 2, name: "Budynek B", address: "ul. Jana Pawła II 37, Kraków", createdAt: new Date("2026-11-01T08:00:00Z") }
    ],
    rooms: [
      { id: 1, buildingId: 1, name: "101", capacity: 30, createdAt: new Date("2026-11-01T08:00:00Z") },
      { id: 2, buildingId: 1, name: "102", capacity: 15, createdAt: new Date("2026-11-01T08:00:00Z") },
      { id: 3, buildingId: 1, name: "201", capacity: 50, createdAt: new Date("2026-11-01T08:00:00Z") },
      { id: 4, buildingId: 2, name: "101", capacity: 20, createdAt: new Date("2026-11-01T08:00:00Z") },
      { id: 5, buildingId: 2, name: "202", capacity: 8, createdAt: new Date("2026-11-01T08:00:00Z") }
    ],
    reservations: [
      {
        id: 1, roomId: 1, reservedBy: "Jan Kowalski", participants: 20,
        startTime: new Date("2026-11-20T10:00:00Z"), endTime: new Date("2026-11-20T12:00:00Z"),
        status: "CONFIRMED", createdAt: new Date("2026-11-01T08:00:00Z"), cancelledAt: null
      },
      {
        id: 2, roomId: 1, reservedBy: "Anna Nowak", participants: 10,
        startTime: new Date("2026-11-20T12:00:00Z"), endTime: new Date("2026-11-20T13:00:00Z"),
        status: "CONFIRMED", createdAt: new Date("2026-11-01T09:00:00Z"), cancelledAt: null
      },
      {
        id: 3, roomId: 2, reservedBy: "Piotr Zieliński", participants: 12,
        startTime: new Date("2026-11-21T09:00:00Z"), endTime: new Date("2026-11-21T11:00:00Z"),
        status: "CANCELLED", createdAt: new Date("2026-11-01T10:00:00Z"), cancelledAt: new Date("2026-11-03T12:00:00Z")
      },
      {
        id: 4, roomId: 3, reservedBy: "Maria Wiśniewska", participants: 40,
        startTime: startedAt, endTime: new Date(startedAt.getTime() + 2 * HOUR),
        status: "CONFIRMED", createdAt: new Date(startedAt.getTime() - 24 * HOUR), cancelledAt: null
      },
      {
        id: 5, roomId: 4, reservedBy: "Tomasz Lewandowski", participants: 15,
        startTime: new Date("2026-11-25T14:00:00Z"), endTime: new Date("2026-11-25T16:00:00Z"),
        status: "CONFIRMED", createdAt: new Date("2026-11-02T08:00:00Z"), cancelledAt: null
      }
    ]
  };
}

module.exports = { createSeedData };
