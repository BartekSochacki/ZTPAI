const { createUsersRepository } = require("../modules/users/users.repository.knex");
const { createBuildingsRepository } = require("../modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("../modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("../modules/reservations/reservations.repository.knex");
const { createAuditLogRepository } = require("../modules/audit/audit.repository.knex");

function createRepositories(db) {
  return {
    usersRepository: createUsersRepository(db),
    buildingsRepository: createBuildingsRepository(db),
    roomsRepository: createRoomsRepository(db),
    reservationsRepository: createReservationsRepository(db),
    auditLogRepository: createAuditLogRepository(db)
  };
}

function createKnexUnitOfWork(knex) {
  return {
    repositories: createRepositories(knex),
    runInTransaction: work => knex.transaction(trx => work(createRepositories(trx)))
  };
}

module.exports = { createKnexUnitOfWork };
