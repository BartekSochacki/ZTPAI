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

  async function listBuildingRooms(id) {
    await getBuilding(id);
    return roomsRepository.findByBuilding(id);
  }

  return { listBuildings, getBuilding, createBuilding, listBuildingRooms };
}

module.exports = { createBuildingsService };
