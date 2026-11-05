function toRoom(row) {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    createdAt: row.created_at,
    building: { id: row.building_id, name: row.building_name }
  };
}

function createRoomsRepository(db) {
  const withBuilding = () =>
    db("rooms")
      .join("buildings", "buildings.id", "rooms.building_id")
      .select("rooms.*", "buildings.name as building_name");

  return {
    async findAll() {
      const rows = await withBuilding().orderBy("rooms.id");
      return rows.map(toRoom);
    },
    async findById(id) {
      const row = await withBuilding().where("rooms.id", id).first();
      return row ? toRoom(row) : null;
    },
    async findByIdForUpdate(id) {
      const row = await db("rooms").where({ id }).forUpdate().first();
      return row ? toRoom(row) : null;
    },
    async findByBuilding(buildingId) {
      const rows = await withBuilding().where("rooms.building_id", buildingId).orderBy("rooms.id");
      return rows.map(toRoom);
    },
    async create(data) {
      const [row] = await db("rooms")
        .insert({ building_id: data.buildingId, name: data.name, capacity: data.capacity })
        .returning("id");
      return this.findById(row.id);
    },
    async update(id, changes) {
      const updated = await db("rooms").where({ id }).update(changes);
      return updated ? this.findById(id) : null;
    },
    async delete(id) {
      return (await db("rooms").where({ id }).del()) > 0;
    }
  };
}

module.exports = { createRoomsRepository };
