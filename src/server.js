const config = require("./config");
const { createApp } = require("./app");
const { createKnex } = require("./db/knex");
const { createKnexUnitOfWork } = require("./db/unit-of-work.knex");
const { createMemoryUnitOfWork } = require("./db/unit-of-work.memory");
const { createEventBus } = require("./events/eventBus");
const { registerAuditListeners } = require("./events/auditListeners");
const { registerNotificationListeners } = require("./events/notificationListeners");

const useMemory = process.argv.includes("--memory");
const knex = useMemory ? null : createKnex();
const unitOfWork = useMemory ? createMemoryUnitOfWork() : createKnexUnitOfWork(knex);

const eventBus = createEventBus();
registerAuditListeners(eventBus, unitOfWork.repositories.auditLogRepository);
registerNotificationListeners(eventBus, unitOfWork.repositories.usersRepository);

const app = createApp({ ...unitOfWork, config, eventBus, now: () => new Date() });

const server = app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT} (${useMemory ? "in-memory" : "PostgreSQL"})`);
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  server.close(async () => {
    console.log("HTTP server closed");
    if (knex) {
      await knex.destroy();
      console.log("Database pool closed");
    }
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
