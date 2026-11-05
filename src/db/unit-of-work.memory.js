const bcrypt = require("bcryptjs");
const { createSeedData } = require("./seed-data");
const { createUsersRepository } = require("../modules/users/users.repository.memory");
const { createBuildingsRepository } = require("../modules/buildings/buildings.repository.memory");
const { createRoomsRepository } = require("../modules/rooms/rooms.repository.memory");
const { createReservationsRepository } = require("../modules/reservations/reservations.repository.memory");

function createMemoryUnitOfWork(seed = createSeedData()) {
  const db = structuredClone(seed);
  db.users = db.users.map(({ password, ...user }) => ({ ...user, passwordHash: bcrypt.hashSync(password, 10) }));

  const repositories = {
    usersRepository: createUsersRepository(db),
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
