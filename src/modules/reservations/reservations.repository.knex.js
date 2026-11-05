const COLUMNS = {
  roomId: "room_id",
  userId: "user_id",
  participants: "participants",
  startTime: "start_time",
  endTime: "end_time",
  status: "status",
  createdAt: "created_at",
  cancelledAt: "cancelled_at"
};

function toReservation(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    room: {
      id: row.room_id,
      name: row.room_name,
      building: { id: row.building_id, name: row.building_name }
    },
    userId: row.user_id,
    user: { id: row.user_id, email: row.user_email },
    participants: row.participants,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at
  };
}

function toRow(data) {
  const row = {};
  for (const [field, column] of Object.entries(COLUMNS)) {
    if (data[field] !== undefined) row[column] = data[field];
  }
  return row;
}

const SORT_COLUMNS = {
  startTime: "reservations.start_time",
  createdAt: "reservations.created_at",
  participants: "reservations.participants"
};

function applyFilters(query, { roomId, buildingId, userId, status, from, to }) {
  if (roomId !== undefined) query.where("reservations.room_id", roomId);
  if (buildingId !== undefined) query.where("rooms.building_id", buildingId);
  if (userId !== undefined) query.where("reservations.user_id", userId);
  if (status !== undefined) query.where("reservations.status", status);
  if (to !== undefined) query.where("reservations.start_time", "<", to);
  if (from !== undefined) query.where("reservations.end_time", ">", from);
  return query;
}

function createReservationsRepository(db) {
  const withRelations = () =>
    db("reservations")
      .join("rooms", "rooms.id", "reservations.room_id")
      .join("buildings", "buildings.id", "rooms.building_id")
      .join("users", "users.id", "reservations.user_id")
      .select(
        "reservations.*",
        "rooms.name as room_name",
        "buildings.id as building_id",
        "buildings.name as building_name",
        "users.email as user_email"
      );

  return {
    async findAll({ page = 1, limit = 20, sort = "startTime", ...filters } = {}) {
      const descending = sort.startsWith("-");
      const column = SORT_COLUMNS[descending ? sort.slice(1) : sort];

      const rows = await applyFilters(withRelations(), filters)
        .orderBy(column, descending ? "desc" : "asc")
        .orderBy("reservations.id", "asc")
        .limit(limit)
        .offset((page - 1) * limit);

      const [{ total }] = await applyFilters(
        db("reservations").join("rooms", "rooms.id", "reservations.room_id"),
        filters
      ).count("reservations.id as total");

      return { items: rows.map(toReservation), total: Number(total) };
    },
    async findById(id) {
      const row = await withRelations().where("reservations.id", id).first();
      return row ? toReservation(row) : null;
    },
    async findConfirmedByRoom(roomId) {
      const rows = await db("reservations").where({ room_id: roomId, status: "CONFIRMED" });
      return rows.map(row => ({ id: row.id, startTime: row.start_time, endTime: row.end_time }));
    },
    async create(data) {
      const [row] = await db("reservations").insert(toRow(data)).returning("id");
      return this.findById(row.id);
    },
    async update(id, changes) {
      await db("reservations").where({ id }).update(toRow(changes));
      return this.findById(id);
    }
  };
}

module.exports = { createReservationsRepository };
