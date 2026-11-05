const { NotFoundError } = require("../../errors/AppError");

function createRoomsService({ roomsRepository, buildingsRepository }) {
  async function listRooms() {
    return roomsRepository.findAll();
  }

  async function getRoom(id) {
    const room = await roomsRepository.findById(id);
    if (!room) throw new NotFoundError("Room");
    return room;
  }

  async function createRoom(input) {
    const building = await buildingsRepository.findById(input.buildingId);
    if (!building) throw new NotFoundError("Building");
    return roomsRepository.create(input);
  }

  async function updateRoom(id, changes) {
    const room = await roomsRepository.update(id, changes);
    if (!room) throw new NotFoundError("Room");
    return room;
  }

  async function deleteRoom(id) {
    const deleted = await roomsRepository.delete(id);
    if (!deleted) throw new NotFoundError("Room");
  }

  return { listRooms, getRoom, createRoom, updateRoom, deleteRoom };
}

module.exports = { createRoomsService };
