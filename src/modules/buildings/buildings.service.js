const { NotFoundError } = require("../../errors/AppError");

function createBuildingsService({ buildingsRepository, roomsRepository }) {
  async function listBuildings() {
    return buildingsRepository.findAll();
  }

  async function getBuilding(id) {
    const building = await buildingsRepository.findById(id);
    if (!building) throw new NotFoundError("Building");
    return building;
  }

  async function createBuilding(input) {
    return buildingsRepository.create(input);
  }

  async function updateBuilding(id, changes) {
    const building = await buildingsRepository.update(id, changes);
    if (!building) throw new NotFoundError("Building");
    return building;
  }

  async function deleteBuilding(id) {
    const deleted = await buildingsRepository.delete(id);
    if (!deleted) throw new NotFoundError("Building");
  }

  async function listBuildingRooms(id) {
    await getBuilding(id);
    return roomsRepository.findByBuilding(id);
  }

  return { listBuildings, getBuilding, createBuilding, updateBuilding, deleteBuilding, listBuildingRooms };
}

module.exports = { createBuildingsService };
