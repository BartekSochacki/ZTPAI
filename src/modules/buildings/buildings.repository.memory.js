const { uniqueViolation } = require("../../db/memory-errors");

function createBuildingsRepository(db) {
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
      if (db.buildings.some(b => b.name === data.name)) {
        throw uniqueViolation("buildings_name_unique");
      }
      const building = { id: Math.max(0, ...db.buildings.map(b => b.id)) + 1, ...data, createdAt: new Date() };
      db.buildings.push(building);
      return building;
    }
  };
}

module.exports = { createBuildingsRepository };
