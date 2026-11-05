const COLUMNS = {
  roomId: "room_id",
  reservedBy: "reserved_by",
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
    reservedBy: row.reserved_by,
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

function applyFilters(query, { roomId, buildingId, status, from, to }) {
  if (roomId !== undefined) query.where("reservations.room_id", roomId);
  if (buildingId !== undefined) query.where("rooms.building_id", buildingId);
  if (status !== undefined) query.where("reservations.status", status);
  if (to !== undefined) query.where("reservations.start_time", "<", to);
  if (from !== undefined) query.where("reservations.end_time", ">", from);
  return query;
}

function createReservationsRepository(db) {
  const withRoomAndBuilding = () =>
    db("reservations")
      .join("rooms", "rooms.id", "reservations.room_id")
      .join("buildings", "buildings.id", "rooms.building_id")
      .select(
        "reservations.*",
        "rooms.name as room_name",
        "buildings.id as building_id",
        "buildings.name as building_name"
      );

  return {
    async findAll({ page = 1, limit = 20, sort = "startTime", ...filters } = {}) {
      const descending = sort.startsWith("-");
      const column = SORT_COLUMNS[descending ? sort.slice(1) : sort];

      const rows = await applyFilters(withRoomAndBuilding(), filters)
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
      const row = await withRoomAndBuilding().where("reservations.id", id).first();
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
