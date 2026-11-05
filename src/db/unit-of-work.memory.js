const { createSeedData } = require("./seed-data");
const { createBuildingsRepository } = require("../modules/buildings/buildings.repository.memory");
const { createRoomsRepository } = require("../modules/rooms/rooms.repository.memory");
const { createReservationsRepository } = require("../modules/reservations/reservations.repository.memory");

function createMemoryUnitOfWork(seed = createSeedData()) {
  const db = structuredClone(seed);
  const repositories = {
    buildingsRepository: createBuildingsRepository(db),
    roomsRepository: createRoomsRepository(db),
    reservationsRepository: createReservationsRepository(db)
  };

  return {
    repositories,
    runInTransaction: work => work(repositories)
  };
}

module.exports = { createMemoryUnitOfWork };
