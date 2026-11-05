const { uniqueViolation, foreignKeyViolation } = require("../../db/memory-errors");

function createRoomsRepository(db) {
  const withBuilding = room => {
    const building = db.buildings.find(b => b.id === room.buildingId);
    return { ...room, building: { id: building.id, name: building.name } };
  };
  const nameTaken = (buildingId, name, exceptId) =>
    db.rooms.some(r => r.buildingId === buildingId && r.name === name && r.id !== exceptId);

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
      if (nameTaken(data.buildingId, data.name)) throw uniqueViolation("rooms_building_id_name_unique");
      const room = { id: Math.max(0, ...db.rooms.map(r => r.id)) + 1, ...data, createdAt: new Date() };
      db.rooms.push(room);
      return withBuilding(room);
    },
    async update(id, changes) {
      const room = db.rooms.find(r => r.id === id);
      if (!room) return null;
      if (changes.name !== undefined && nameTaken(room.buildingId, changes.name, id)) {
        throw uniqueViolation("rooms_building_id_name_unique");
      }
      return withBuilding(Object.assign(room, changes));
    },
    async delete(id) {
      if (db.reservations.some(r => r.roomId === id)) throw foreignKeyViolation("reservations_room_id_foreign");
      const index = db.rooms.findIndex(r => r.id === id);
      if (index === -1) return false;
      db.rooms.splice(index, 1);
      return true;
    }
  };
}

module.exports = { createRoomsRepository };
