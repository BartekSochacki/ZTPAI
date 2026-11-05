const { uniqueViolation, foreignKeyViolation } = require("../../db/memory-errors");

function createBuildingsRepository(db) {
  const nameTaken = (name, exceptId) => db.buildings.some(b => b.name === name && b.id !== exceptId);

  return {
    async findAll() {
      return db.buildings.map(b => ({
        ...b,
        roomsCount: db.rooms.filter(r => r.buildingId === b.id).length
      }));
    },
    async findById(id) {
      return db.buildings.find(b => b.id === id) ?? null;
    },
    async create(data) {
      if (nameTaken(data.name)) throw uniqueViolation("buildings_name_unique");
      const building = { id: Math.max(0, ...db.buildings.map(b => b.id)) + 1, ...data, createdAt: new Date() };
      db.buildings.push(building);
      return building;
    },
    async update(id, changes) {
      const building = db.buildings.find(b => b.id === id);
      if (!building) return null;
      if (changes.name !== undefined && nameTaken(changes.name, id)) throw uniqueViolation("buildings_name_unique");
      return Object.assign(building, changes);
    },
    async delete(id) {
      if (db.rooms.some(r => r.buildingId === id)) throw foreignKeyViolation("rooms_building_id_foreign");
      const index = db.buildings.findIndex(b => b.id === id);
      if (index === -1) return false;
      db.buildings.splice(index, 1);
      return true;
    }
  };
}

module.exports = { createBuildingsRepository };
