const express = require("express");
const swaggerUi = require("swagger-ui-express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { createAuthenticate } = require("./middleware/authenticate");
const openapi = require("./docs/openapi");
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createBuildingsService } = require("./modules/buildings/buildings.service");
const { createBuildingsController } = require("./modules/buildings/buildings.controller");
const { createBuildingsRouter } = require("./modules/buildings/buildings.routes");
const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");
const { createReservationsService } = require("./modules/reservations/reservations.service");
const { createReservationsController } = require("./modules/reservations/reservations.controller");
const { createReservationsRouter } = require("./modules/reservations/reservations.routes");
const { createAuditService } = require("./modules/audit/audit.service");
const { createAuditController } = require("./modules/audit/audit.controller");
const { createAuditRouter } = require("./modules/audit/audit.routes");
const { noopEventBus } = require("./events/eventBus");

function createApp({ repositories, runInTransaction, config, eventBus = noopEventBus, now }) {
  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  const authenticate = createAuthenticate(config);
  const authService = createAuthService({ ...repositories, config });
  const buildingsService = createBuildingsService(repositories);
  const roomsService = createRoomsService(repositories);
  const reservationsService = createReservationsService({ ...repositories, runInTransaction, eventBus, now });
  const auditService = createAuditService(repositories);

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } }));
  app.use("/api/auth", createAuthRouter(createAuthController(authService), authenticate));
  app.use("/api/buildings", authenticate, createBuildingsRouter(createBuildingsController(buildingsService)));
  app.use("/api/rooms", authenticate, createRoomsRouter(createRoomsController(roomsService)));
  app.use("/api/reservations", authenticate, createReservationsRouter(createReservationsController(reservationsService)));
  app.use("/api/admin/audit-log", authenticate, createAuditRouter(createAuditController(auditService)));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
