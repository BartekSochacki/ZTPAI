function toBuilding(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
    roomsCount: row.rooms_count === undefined ? undefined : Number(row.rooms_count)
  };
}

function createBuildingsRepository(db) {
  return {
    async findAll() {
      const rows = await db("buildings")
        .leftJoin("rooms", "rooms.building_id", "buildings.id")
        .select("buildings.*")
        .count("rooms.id as rooms_count")
        .groupBy("buildings.id")
        .orderBy("buildings.id");
      return rows.map(toBuilding);
    },
    async findById(id) {
      const row = await db("buildings").where({ id }).first();
      return row ? toBuilding(row) : null;
    },
    async create(data) {
      const [row] = await db("buildings")
        .insert({ name: data.name, address: data.address })
        .returning("*");
      return toBuilding(row);
    }
  };
}

module.exports = { createBuildingsRepository };
