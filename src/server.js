require("dotenv").config();
const { createApp } = require("./app");
const { createKnex } = require("./db/knex");
const { createKnexUnitOfWork } = require("./db/unit-of-work.knex");
const { createMemoryUnitOfWork } = require("./db/unit-of-work.memory");

const PORT = process.env.PORT || 3000;

const useMemory = process.argv.includes("--memory");
const unitOfWork = useMemory ? createMemoryUnitOfWork() : createKnexUnitOfWork(createKnex());

const app = createApp({ ...unitOfWork, now: () => new Date() });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (${useMemory ? "in-memory" : "PostgreSQL"})`);
});
