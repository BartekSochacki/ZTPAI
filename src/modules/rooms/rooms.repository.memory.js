const { uniqueViolation } = require("../../db/memory-errors");

function createRoomsRepository(db) {
  const withBuilding = room => {
    const building = db.buildings.find(b => b.id === room.buildingId);
    return { ...room, building: { id: building.id, name: building.name } };
  };

  return {
    async findAll() {
      return db.rooms.map(withBuilding);
    },
    async findById(id) {
      const room = db.rooms.find(r => r.id === id);
      return room ? withBuilding(room) : null;
    },
    async findByIdForUpdate(id) {
      return this.findById(id);
    },
    async findByBuilding(buildingId) {
      return db.rooms.filter(r => r.buildingId === buildingId).map(withBuilding);
    },
    async create(data) {
      if (db.rooms.some(r => r.buildingId === data.buildingId && r.name === data.name)) {
        throw uniqueViolation("rooms_building_id_name_unique");
      }
      const room = { id: Math.max(0, ...db.rooms.map(r => r.id)) + 1, ...data, createdAt: new Date() };
      db.rooms.push(room);
      return withBuilding(room);
    }
  };
}

module.exports = { createRoomsRepository };
