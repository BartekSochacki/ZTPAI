const config = require("./config");
const { createApp } = require("./app");
const { createKnex } = require("./db/knex");
const { createKnexUnitOfWork } = require("./db/unit-of-work.knex");
const { createMemoryUnitOfWork } = require("./db/unit-of-work.memory");

const useMemory = process.argv.includes("--memory");
const unitOfWork = useMemory ? createMemoryUnitOfWork() : createKnexUnitOfWork(createKnex());

const app = createApp({ ...unitOfWork, config, now: () => new Date() });

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT} (${useMemory ? "in-memory" : "PostgreSQL"})`);
});
